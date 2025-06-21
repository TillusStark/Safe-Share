
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Check, AlertTriangle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploaderProps {
  userId: string;
  onUploaded: (url: string) => void;
}

type ModerationStatus = "idle" | "analyzing" | "approved" | "blocked" | "uploading" | "success" | "error";
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

  // Convert file to base64 for image analysis
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeContent = async (file: File): Promise<boolean> => {
    setModerationStatus("analyzing");
    setError("");
    
    try {
      const imageData = await fileToBase64(file);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        setError("Authentication required. Please log in again.");
        setModerationStatus("error");
        return false;
      }

      const response = await fetch(
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
            caption: "User profile avatar upload",
            imageData: imageData
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Moderation service error: ${response.status}`);
      }
      
      const result = await response.json();
      setModerationResult(result);
      
      if (result.status === "failed") {
        setModerationStatus("blocked");
        setError("Avatar image violates community guidelines and cannot be uploaded.");
        toast({
          title: "Avatar Blocked",
          description: "Your avatar image violates our community guidelines.",
          variant: "destructive",
        });
        return false;
      } else {
        setModerationStatus("approved");
        toast({
          title: "Avatar Approved",
          description: "Your avatar has been approved and is ready to upload.",
        });
        return true;
      }
    } catch (error) {
      console.error("Moderation error:", error);
      setModerationStatus("blocked");
      setError("Unable to verify image safety. Upload blocked.");
      toast({
        title: "Avatar Analysis Failed",
        description: "Unable to verify avatar safety. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selectedFile = e.target.files[0];
      
      // Validate file size
      const maxSizeMB = 5;
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`);
        toast({
          variant: "destructive",
          title: "File too large",
          description: `File size exceeds ${maxSizeMB}MB limit.`
        });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Unsupported file type. Please upload JPG, PNG, GIF or WEBP.");
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Unsupported file type. Please upload JPG, PNG, GIF or WEBP."
        });
        return;
      }

      setFile(selectedFile);
      setError("");
      setModerationResult(null);
      
      // Immediately start content analysis
      await analyzeContent(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || moderationStatus !== "approved") return;
    
    setModerationStatus("uploading");
    
    try {
      const extMatch = file.name.match(/\.(\w+)$/);
      const ext = extMatch?.[1] || "png";
      const filePath = `${userId}/${Date.now()}.${ext}`;

      let uploadProgressTimer: any;
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
          description: uploadError.message || "Could not upload the image."
        });
        return;
      }
      
      setUploadProgress(100);

      const { data: urlData } = supabase.storage
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
      console.error("Unexpected upload error:", e);
      setError(e.message || "An unexpected error occurred uploading. Try again.");
      setModerationStatus("error");
      toast({
        variant: "destructive",
        title: "Upload error",
        description: e.message || "An unexpected error occurred."
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

  const renderModerationStatus = () => {
    switch (moderationStatus) {
      case "analyzing":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs mb-2 flex items-center">
            <Shield className="h-4 w-4 text-blue-600 mr-2 animate-pulse" />
            <div>
              <p className="font-medium text-blue-800">AI Analyzing Avatar...</p>
              <p className="text-blue-600">Checking for safety violations</p>
            </div>
          </div>
        );
      
      case "approved":
        return (
          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs mb-2 flex items-center">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <p className="font-medium text-green-800">Avatar Approved</p>
              <p className="text-green-600">Safe to upload</p>
            </div>
          </div>
        );
      
      case "blocked":
        return (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs mb-2">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 mb-1">Avatar Blocked</p>
                <p className="text-red-600 mb-2">Violates community guidelines</p>
                {moderationResult?.issues && moderationResult.issues.length > 0 && (
                  <ul className="space-y-1">
                    {moderationResult.issues.map((issue, i) => (
                      <li key={i} className="text-red-600 text-xs">
                        <strong>{issue.category}:</strong> {issue.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={reset}
              disabled={moderationStatus === "analyzing" || moderationStatus === "uploading"}
            >
              <X />
            </Button>
          </div>

          {renderModerationStatus()}

          {(moderationStatus === "uploading") && (
            <Progress value={uploadProgress} className="h-2 w-full mb-2" />
          )}

          {moderationStatus === "success" && (
            <div className="flex items-center text-green-700 gap-1 mb-2">
              <Check /> Uploaded!
            </div>
          )}

          {error && moderationStatus !== "blocked" && (
            <div className="bg-red-50 text-red-700 rounded p-2 text-xs mb-2 w-full flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {moderationStatus === "approved" && (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleUpload}
            >
              Upload Avatar
            </Button>
          )}

          {moderationStatus === "blocked" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={reset}
            >
              Try Different Image
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;
