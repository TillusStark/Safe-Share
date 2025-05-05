
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploaderProps {
  userId: string;
  onUploaded: (url: string) => void;
}

type ModerationStatus = "idle" | "uploading" | "processing" | "success" | "failed" | "error";
type ModerationResult = {
  status: "passed" | "failed" | "warning";
  issues: { category: string; description: string; severity: "low" | "medium" | "high" }[];
};

const AvatarUploader = ({ userId, onUploaded }: AvatarUploaderProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>("idle");
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setError("");
      setModerationResult(null);
      setModerationStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setModerationStatus("processing");
    setError("");

    // Check file size
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`);
      setModerationStatus("error");
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload JPG, PNG, GIF or WEBP.");
      setModerationStatus("error");
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Unsupported file type. Please upload JPG, PNG, GIF or WEBP."
      });
      return;
    }

    // Get the session for authorization
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      setError("Authentication required. Please log in again.");
      setModerationStatus("error");
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to upload avatar images."
      });
      return;
    }

    // Check with moderation function (using caption as "User avatar upload")
    try {
      const resp = await fetch(
        "https://qiarxphbkbxhkttrwlqb.functions.supabase.co/moderate-content",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            filename: file.name,
            type: file.type,
            caption: "User profile avatar upload"
          })
        }
      );
      
      if (!resp.ok) {
        console.error("Moderation API error:", resp.status, await resp.text());
        throw new Error(`Server responded with status: ${resp.status}`);
      }
      
      const result = await resp.json();
      setModerationResult(result);

      if (result.status === "failed") {
        setModerationStatus("failed");
        setError("Avatar image did not pass moderation.");
        toast({
          variant: "destructive",
          title: "Moderation failed",
          description: "The image could not be uploaded due to moderation policy."
        });
        return;
      }
    } catch (err) {
      console.error("Moderation error:", err);
      
      // Fall back to allowing upload even if moderation fails
      setModerationResult({
        status: "warning",
        issues: [{ 
          category: "Service Error", 
          description: "Could not verify image content. Your upload will continue, but may be subject to review.", 
          severity: "medium" 
        }]
      });
      
      toast({
        // Changed from "warning" to "default" to fix the type error
        variant: "default", 
        title: "Moderation service unavailable",
        description: "We'll continue with your upload, but it may be subject to review."
      });
      // Continue with upload despite moderation failure
    }

    setModerationStatus("uploading");
    
    // Upload to Supabase Storage
    const extMatch = file.name.match(/\.(\w+)$/);
    const ext = extMatch?.[1] || "png"; // default extension
    
    // Structure the file path to match our RLS policies - userId/filename
    const filePath = `${userId}/${Date.now()}.${ext}`;

    let uploadProgressTimer: any;
    try {
      // Simulate progress (we'll update it while uploading)
      setUploadProgress(10);
      uploadProgressTimer = setInterval(() => {
        setUploadProgress((old) => Math.min(95, old + Math.random() * 10));
      }, 180);

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      clearInterval(uploadProgressTimer);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(uploadError.message || "Upload failed. Please try again.");
        setModerationStatus("error");
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: uploadError.message || "Could not upload the image. Please try again."
        });
        return;
      }
      setUploadProgress(100);

      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        setError("Could not get avatar URL.");
        setModerationStatus("error");
        toast({
          variant: "destructive",
          title: "Upload error",
          description: "Could not retrieve the uploaded image URL."
        });
        return;
      }
      setModerationStatus("success");
      toast({
        title: "Upload successful",
        description: "Your avatar has been uploaded successfully."
      });
      onUploaded(urlData.publicUrl);
    } catch (e: any) {
      clearInterval(uploadProgressTimer);
      console.error("Unexpected upload error:", e);
      setError(e.message || "An unexpected error occurred uploading. Try again.");
      setModerationStatus("error");
      toast({
        variant: "destructive",
        title: "Upload error",
        description: e.message || "An unexpected error occurred. Please try again."
      });
    }
  };

  const reset = () => {
    setFile(null);
    setError("");
    setUploadProgress(0);
    setModerationStatus("idle");
    setModerationResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
        style={{ display: "none" }}
        id="avatar-input"
        onChange={handleFileChange}
      />
      {!file && (
        <Button
          variant="secondary"
          className="bg-purple-600 text-white hover:bg-purple-700"
          onClick={() => document.getElementById("avatar-input")?.click()}
        >
          <ImagePlus className="mr-2" /> Change Avatar
        </Button>
      )}

      {file && (
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-700 text-sm truncate max-w-xs">{file.name}</span>
            <Button variant="ghost" size="icon" onClick={reset}><X /></Button>
          </div>

          {(moderationStatus === "processing" || moderationStatus === "uploading") && (
            <Progress value={uploadProgress} className="h-2 w-full mb-2" />
          )}

          {moderationStatus === "failed" && (
            <div className="bg-red-50 text-red-700 rounded p-2 text-xs mb-2">
              {error}
              {moderationResult?.issues?.length > 0 && (
                <ul className="mt-1 text-red-600 list-disc pl-4">
                  {moderationResult.issues.map((issue, i) => (
                    <li key={i}>{issue.category}: {issue.description}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {moderationStatus === "success" && (
            <div className="flex items-center text-green-700 gap-1 mb-2">
              <Check /> Uploaded!
            </div>
          )}

          {error && moderationStatus !== "failed" && (
            <div className="bg-red-50 text-red-700 rounded p-2 text-xs mb-2 w-full flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {(moderationStatus === "idle" || moderationStatus === "failed" || moderationStatus === "error") && (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleUpload}
            >
              Upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;
