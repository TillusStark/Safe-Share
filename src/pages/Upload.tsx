
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import UploadDropzone from "@/components/UploadDropzone";
import ModerationStatus from "@/components/ModerationStatus";

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
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);

  const handleUpload = async (file: File) => {
    setFile(file);
    setStatus("uploading");

    // Simulate file upload
    setTimeout(() => {
      setStatus("processing");
      toast({
        title: "Upload successful",
        description: "Your content is now being analyzed by our AI moderation system",
      });

      // Simulate AI processing
      setTimeout(() => {
        // Simulate a moderation result
        // In a real app, this would come from an API call to your AI moderation system
        const simulatedResult: ModerationResult = {
          status: "passed",
          issues: [],
        };
        
        setModerationResult(simulatedResult);
        setStatus("success");
        toast({
          title: "Moderation complete",
          description: "Your content has passed our safety checks and is ready to be published",
        });
      }, 3000);
    }, 2000);
  };

  const resetUpload = () => {
    setFile(null);
    setStatus("idle");
    setModerationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Upload Content</h1>
          <p className="text-gray-600 mt-2">
            All uploads are automatically screened by our AI moderation system for safety.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Content Upload</CardTitle>
            <CardDescription>
              Drag and drop your video or images, or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "idle" ? (
              <UploadDropzone onUpload={handleUpload} />
            ) : (
              <ModerationStatus 
                status={status} 
                file={file} 
                moderationResult={moderationResult}
                onReset={resetUpload}
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Content Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Our AI system screens content for the following issues:
              </p>
              <ul className="space-y-2">
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>No sensitive personal data (phone numbers, addresses, ID cards)</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>No violence, hate speech, or bullying content</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>No nudity or explicit content</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>No content promoting self-harm or dangerous activities</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>No deepfakes or manipulated media</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
