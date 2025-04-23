
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

    // Check with moderation function (using caption as "User avatar upload")
    try {
      const resp = await fetch(
        `https://qiarxphbkbxhkttrwlqb.functions.supabase.co/moderate-content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            type: file.type,
            caption: "User profile avatar upload"
          })
        }
      );
      const result = await resp.json();
      setModerationResult(result);

      if (result.status === "failed") {
        setModerationStatus("failed");
        setError("Avatar image did not pass moderation.");
        return;
      }
    } catch (err) {
      setError("Failed to moderate image. Try again.");
      setModerationStatus("error");
      return;
    }

    setModerationStatus("uploading");
    // Upload to Supabase Storage
    const extMatch = file.name.match(/\.(\w+)$/);
    const ext = extMatch?.[1] || "png"; // default extension
    const filePath = `${userId}.${Date.now()}.${ext}`;

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
        setError("Upload failed. Please try again.");
        setModerationStatus("error");
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
        return;
      }
      setModerationStatus("success");
      onUploaded(urlData.publicUrl);
    } catch (e: any) {
      clearInterval(uploadProgressTimer);
      setError("An error occurred uploading. Try again.");
      setModerationStatus("error");
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
        accept="image/png, image/jpeg, image/jpg, image/gif"
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
            <Progress value={uploadProgress} className="h-2 w-40 mb-2" />
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
            <div className="bg-red-50 text-red-700 rounded p-2 text-xs mb-2">{error}</div>
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

