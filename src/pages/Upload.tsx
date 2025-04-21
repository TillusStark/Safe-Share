
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import UploadDropzone from "@/components/UploadDropzone";
import ModerationStatus from "@/components/ModerationStatus";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

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

  const handleShareNow = () => {
    // In a real app, you would save the post to the database here
    toast({
      title: "Post shared!",
      description: "Your content has been published",
    });
    
    // Navigate back to the homepage after successful share
    navigate("/");
  };

  const handleUploadAnother = () => {
    resetUpload();
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
              <ModerationStatus 
                status={status} 
                file={file} 
                moderationResult={moderationResult}
                onReset={resetUpload}
                onShare={handleShareNow}
                onUploadAnother={handleUploadAnother}
              />
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
