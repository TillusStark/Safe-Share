
import { CheckCircle, AlertTriangle, X, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";
type ModerationResult = {
  status: "passed" | "failed" | "warning";
  issues: {
    category: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
};

interface ModerationStatusProps {
  status: UploadStatus;
  file: File | null;
  moderationResult: ModerationResult | null;
  onReset: () => void;
}

const ModerationStatus = ({ status, file, moderationResult, onReset }: ModerationStatusProps) => {
  const renderStatusContent = () => {
    switch (status) {
      case "uploading":
        return (
          <div className="text-center py-6">
            <Progress value={75} className="mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading your content...</h3>
            <p className="text-gray-600">Please wait while we upload your file.</p>
          </div>
        );
      
      case "processing":
        return (
          <div className="text-center py-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 stroke-current"
                  strokeWidth="4"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Analysis in Progress</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Our AI system is analyzing your content for safety and compliance.
              This usually takes less than a minute.
            </p>
          </div>
        );
      
      case "success":
        return (
          <div className="py-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">Content Approved!</h3>
              <p className="text-gray-600 text-center mt-2">
                Your content has passed our AI moderation checks and is safe to publish.
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Publish Now
              </Button>
              <Button variant="outline" onClick={onReset}>
                Upload Another
              </Button>
            </div>
          </div>
        );
      
      case "error":
        return (
          <div className="py-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center">Moderation Issues Found</h3>
              <p className="text-gray-600 text-center mt-2">
                Our AI system detected content that doesn't meet our community guidelines.
              </p>
            </div>
            
            {moderationResult?.issues.length ? (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-800 mb-2">Issues detected:</h4>
                <ul className="space-y-2">
                  {moderationResult.issues.map((issue, index) => (
                    <li key={index} className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">{issue.category}</p>
                        <p className="text-sm text-red-700">{issue.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={onReset}>
                Try Again
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg">
      {file && (
        <div className="px-6 pt-4 pb-2 border-b bg-gray-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
              <Upload className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="px-6 py-4">
        {renderStatusContent()}
      </div>
    </div>
  );
};

export default ModerationStatus;
