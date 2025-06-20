
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MultiImageUploadDropzone from "@/components/MultiImageUploadDropzone";
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
  const [files, setFiles] = useState<File[]>([]);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [caption, setCaption] = useState("");
  const [isSharingNow, setIsSharingNow] = useState(false);

  const moderateFiles = async (files: File[], caption: string): Promise<ModerationResult> => {
    // For multiple files, we'll moderate the first one as a representative
    const primaryFile = files[0];
    
    try {
      console.log("Sending for moderation:", { filename: primaryFile.name, type: primaryFile.type, caption, totalFiles: files.length });
      
      const response = await fetch("https://qiarxphbkbxhkttrwlqb.supabase.co/functions/v1/moderate-content", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`,
        },
        body: JSON.stringify({ 
          filename: primaryFile.name, 
          type: primaryFile.type,
          caption: caption,
          fileCount: files.length
        }),
      });
      
      if (!response.ok) {
        console.error("Moderation API error:", response.status, response.statusText);
        return {
          status: "warning",
          issues: [{
            category: "Service Unavailable",
            description: "Automatic moderation is currently unavailable. Your content may be subject to manual review.",
            severity: "medium"
          }]
        };
      }
      
      const result = await response.json();
      console.log("Moderation result:", result);
      return result;
    } catch (error) {
      console.error("Error during moderation:", error);
      return {
        status: "warning",
        issues: [{
          category: "Connection Error",
          description: "Could not connect to the moderation service. Your content may be subject to manual review.",
          severity: "medium"
        }]
      };
    }
  };

  const handleUpload = async (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setStatus("uploading");
    setTimeout(async () => {
      setStatus("processing");
      toast({
        title: "Upload successful",
        description: `Your ${uploadedFiles.length} image${uploadedFiles.length > 1 ? 's are' : ' is'} now being analyzed by our AI moderation system`,
      });

      try {
        const result = await moderateFiles(uploadedFiles, "");
        setModerationResult(result);

        if (result.status === "failed") {
          setStatus("error");
          toast({
            variant: "destructive",
            title: "Moderation issues found",
            description: "Your content could not be approved. Please review the issues.",
          });
        } else {
          setStatus("success");
          toast({
            title: result.status === "passed" ? "Content approved" : "Content requires attention",
            description: result.status === "passed" 
              ? "Your content has passed our safety checks and is ready to be published"
              : "Some potential issues were found. Please review before proceeding.",
          });
        }
      } catch (err) {
        console.error("Unexpected error during moderation process:", err);
        setModerationResult({
          status: "warning",
          issues: [{ 
            category: "Processing Error", 
            description: "Could not fully analyze your files. You may still proceed, but content will be subject to review.", 
            severity: "medium" 
          }],
        });
        setStatus("success");
        toast({
          variant: "destructive",
          title: "Moderation notice",
          description: "We couldn't fully analyze your content, but you may still proceed.",
        });
      }
    }, 1500);
  };

  const resetUpload = () => {
    setFiles([]);
    setStatus("idle");
    setModerationResult(null);
    setCaption("");
    setIsSharingNow(false);
  };

  const handleShareNow = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "You must be logged in",
        description: "Please log in to share a post.",
      });
      return;
    }
    
    if (files.length === 0) {
      toast({ 
        title: "No files selected", 
        description: "Please select files to share." 
      });
      return;
    }
    
    if (!caption.trim()) {
      toast({ 
        title: "Caption required", 
        description: "Please add a caption to your post." 
      });
      return;
    }
    
    setIsSharingNow(true);
    
    try {
      toast({
        title: "Checking content",
        description: "Verifying your post with the provided caption...",
      });
      
      const finalResult = await moderateFiles(files, caption);
      
      if (finalResult.status === "failed") {
        setModerationResult(finalResult);
        setStatus("error");
        toast({
          variant: "destructive",
          title: "Moderation failed",
          description: "Your post with caption didn't pass our content guidelines.",
        });
        setIsSharingNow(false);
        return;
      }

      toast({
        title: "Uploading",
        description: `Uploading your ${files.length} image${files.length > 1 ? 's' : ''}...`,
      });
      
      // Upload each file and create a post for each (or create one post with multiple images)
      // For now, we'll create separate posts for each image
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${i}.${ext}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData?.publicUrl;
        if (!imageUrl) {
          throw new Error("Could not get image URL");
        }

        const postCaption = files.length > 1 ? `${caption} (${i + 1}/${files.length})` : caption;
        
        const { error: insertError } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            image_url: imageUrl,
            caption: postCaption,
          });

        if (insertError) {
          throw new Error(`Failed to save post: ${insertError.message}`);
        }
      }

      toast({
        title: "Posts shared!",
        description: `Your ${files.length} post${files.length > 1 ? 's have' : ' has'} been published successfully`,
      });
      
      navigate("/");
      
    } catch (error) {
      console.error("Error sharing post:", error);
      toast({ 
        variant: "destructive", 
        title: "Error sharing post", 
        description: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    } finally {
      setIsSharingNow(false);
    }
  };

  const handleUploadAnother = () => {
    resetUpload();
  };

  const renderModerationStatus = () => {
    if (status === "success" && files.length > 0) {
      return (
        <div>
          <ModerationStatus 
            status={status} 
            file={files[0]} 
            moderationResult={moderationResult}
            onReset={resetUpload}
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
              disabled={isSharingNow || !caption.trim() || (moderationResult?.status === "failed")}
            >
              {isSharingNow ? "Sharing..." : `Share ${files.length} photo${files.length > 1 ? 's' : ''}`}
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
          file={files[0]} 
          moderationResult={moderationResult}
          onReset={resetUpload}
          onUploadAnother={handleUploadAnother}
          onShare={status === "success" ? handleShareNow : undefined}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
          >
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">New Post</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Share photos that will be automatically checked by our AI
          </p>
        </div>

        <Card className="mb-6 border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-6">
            {status === "idle" ? (
              <MultiImageUploadDropzone onUpload={handleUpload} maxFiles={10} />
            ) : (
              renderModerationStatus()
            )}
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-medium text-purple-900 dark:text-purple-100">
              Our AI checks for
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
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
    <span className="text-sm text-gray-600 dark:text-gray-300">{children}</span>
  </li>
);

export default Upload;
