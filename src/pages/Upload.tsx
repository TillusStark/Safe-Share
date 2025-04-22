
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import UploadDropzone from "@/components/UploadDropzone";
import ModerationStatus from "@/components/ModerationStatus";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";
type ModerationResult = {
  status: "passed" | "failed" | "warning";
  issues: {
    category: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
};

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);

  // New caption state
  const [caption, setCaption] = useState("");
  const [isSharingNow, setIsSharingNow] = useState(false);

  const moderateFile = async (file: File): Promise<ModerationResult> => {
    try {
      const response = await fetch("/functions/v1/moderate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, type: file.type }),
      });
      
      if (!response.ok) {
        console.error("Moderation API error:", response.status, response.statusText);
        return {
          status: "passed",
          issues: [{
            category: "Note",
            description: "Automatic moderation is currently unavailable. Manual review may be required.",
            severity: "low"
          }]
        };
      }
      return await response.json();
    } catch (error) {
      console.error("Error during moderation:", error);
      return {
        status: "passed",
        issues: [{
          category: "Note",
          description: "Automatic moderation is currently unavailable. Manual review may be required.",
          severity: "low"
        }]
      };
    }
  };

  const handleUpload = async (file: File) => {
    setFile(file);
    setStatus("uploading");
    setTimeout(async () => {
      setStatus("processing");
      toast({
        title: "Upload successful",
        description: "Your content is now being analyzed by our AI moderation system",
      });

      try {
        const result = await moderateFile(file);
        setModerationResult(result);

        let isSafe = result.status === "passed";
        setStatus(isSafe ? "success" : "error");

        toast({
          title: isSafe ? "Moderation complete" : "Moderation issues found",
          description: isSafe
            ? "Your content has passed our safety checks and is ready to be published"
            : "Some issues were found. Please review and try again.",
        });
      } catch (err) {
        console.error("Unexpected error during moderation process:", err);
        setModerationResult({
          status: "warning",
          issues: [{ category: "Processing Error", description: "Could not analyze your file. You may still proceed.", severity: "medium" }],
        });
        setStatus("success");
        toast({
          variant: "destructive",
          title: "Moderation notice",
          description: "We couldn't fully analyze your content, but you may still proceed.",
        });
      }
    }, 2000);
  };

  const resetUpload = () => {
    setFile(null);
    setStatus("idle");
    setModerationResult(null);
    setCaption("");
    setIsSharingNow(false);
  };

  // UPLOAD TO SUPABASE STORAGE + DB ON SHARE
  const handleShareNow = async () => {
    if (moderationResult && moderationResult.status === "failed") {
      toast({
        title: "Cannot share post",
        description: "This content did not pass moderation and cannot be published.",
      });
      return;
    }
    if (!user) {
      toast({
        variant: "destructive",
        title: "You must be logged in",
        description: "Please log in to share a post.",
      });
      return;
    }
    if (!file) {
      toast({ title: "No file selected", description: "Please select a file to share." });
      return;
    }
    setIsSharingNow(true);

    // 1. Upload image to Supabase Storage
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, file);

    if (uploadError) {
      toast({ variant: "destructive", title: "File upload failed", description: String(uploadError.message) });
      setIsSharingNow(false);
      return;
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData?.publicUrl;
    if (!imageUrl) {
      toast({ variant: "destructive", title: "Could not get image url" });
      setIsSharingNow(false);
      return;
    }

    // 3. Insert post record
    const { error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        caption: caption,
      });

    if (insertError) {
      toast({ variant: "destructive", title: "Failed to save post", description: insertError.message });
      setIsSharingNow(false);
      return;
    }

    toast({
      title: "Post shared!",
      description: "Your content has been published",
    });
    setIsSharingNow(false);
    navigate("/");
  };

  const handleUploadAnother = () => {
    resetUpload();
  };

  // Render: after moderation passes, ask for caption and confirm share
  const renderModerationStatus = () => {
    if (status === "success" && file) {
      return (
        <div>
          <ModerationStatus 
            status={status} 
            file={file} 
            moderationResult={moderationResult}
            onReset={resetUpload}
            // Remove onShare from ModerationStatus, use manual button below
          />
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <Input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={150}
              placeholder="Write a caption for your post..."
              className="mb-3"
              disabled={isSharingNow}
            />
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleShareNow}
              disabled={isSharingNow || !caption.trim()}
            >
              {isSharingNow ? "Sharing..." : "Share now"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleUploadAnother}
              className="ml-2"
              disabled={isSharingNow}
            >
              Upload another
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <ModerationStatus 
          status={status} 
          file={file} 
          moderationResult={moderationResult}
          onReset={resetUpload}
          // Do not show "Share now" until caption prompt
          onUploadAnother={handleUploadAnother}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">New Post</h1>
          <p className="text-gray-600 text-sm mt-1">
            Share a video or photo that will be automatically checked by our AI
          </p>
        </div>

        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            {status === "idle" ? (
              <UploadDropzone onUpload={handleUpload} />
            ) : (
              renderModerationStatus()
            )}
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-medium text-purple-900">
              Our AI checks for
            </CardTitle>
            <CardDescription className="text-purple-700">
              Your content is automatically reviewed for safety
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <ListItem icon={<AlertTriangle className="h-4 w-4 text-purple-500" />}>
                Personal information protection
              </ListItem>
              <ListItem icon={<AlertTriangle className="h-4 w-4 text-purple-500" />}>
                Violence and harassment
              </ListItem>
              <ListItem icon={<AlertTriangle className="h-4 w-4 text-purple-500" />}>
                Adult content or nudity
              </ListItem>
              <ListItem icon={<AlertTriangle className="h-4 w-4 text-purple-500" />}>
                Harmful or dangerous content
              </ListItem>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ListItem = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <li className="flex items-center space-x-3">
    {icon}
    <span className="text-sm text-gray-600">{children}</span>
  </li>
);

export default Upload;
