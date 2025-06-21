import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, FileType, X, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
}

type ModerationStatus = "idle" | "analyzing" | "approved" | "blocked" | "error";

const UploadDropzone = ({ onUpload }: UploadDropzoneProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>("idle");
  const [moderationResult, setModerationResult] = useState<any>(null);
  const { toast } = useToast();

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
    
    try {
      let imageData = null;
      
      // Convert image to base64 for analysis
      if (file.type.startsWith('image/')) {
        imageData = await fileToBase64(file);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

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
            caption: "User upload",
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
        toast({
          title: "Content Blocked",
          description: "Your content violates our community guidelines and cannot be uploaded.",
          variant: "destructive",
        });
        return false;
      } else {
        setModerationStatus("approved");
        toast({
          title: "Content Approved",
          description: "Your content has been approved by our AI moderation system.",
        });
        return true;
      }
    } catch (error) {
      console.error("Moderation error:", error);
      setModerationStatus("blocked");
      setModerationResult({
        status: "failed",
        issues: [{
          category: "System Error",
          description: "Unable to verify content safety. Upload blocked.",
          severity: "high"
        }]
      });
      toast({
        title: "Content Analysis Failed",
        description: "Unable to verify content safety. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // Immediately start content analysis
      const isApproved = await analyzeContent(file);
      
      if (!isApproved) {
        // Content was blocked, keep file selected to show blocking message
        return;
      }
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false)
  });

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setModerationStatus("idle");
    setModerationResult(null);
  };

  const handleUpload = () => {
    if (!selectedFile || moderationStatus !== "approved") return;
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        onUpload(selectedFile);
      }
    }, 100);
  };

  const getFileType = (file: File) => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    return 'unknown';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderModerationStatus = () => {
    switch (moderationStatus) {
      case "analyzing":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-blue-800">AI Analyzing Content...</p>
                <p className="text-xs text-blue-600">Checking for safety violations</p>
              </div>
            </div>
          </div>
        );
      
      case "approved":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Content Approved</p>
                <p className="text-xs text-green-600">Safe to upload</p>
              </div>
            </div>
          </div>
        );
      
      case "blocked":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-2">Content Blocked</p>
                <p className="text-xs text-red-600 mb-3">
                  Your content violates our community guidelines and cannot be uploaded.
                </p>
                {moderationResult?.issues && moderationResult.issues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-700">Detected violations:</p>
                    <ul className="space-y-1">
                      {moderationResult.issues.map((issue: any, index: number) => (
                        <li key={index} className="text-xs text-red-600 flex items-start">
                          <span className="w-1 h-1 bg-red-400 rounded-full inline-block mt-1.5 mr-2 flex-shrink-0"></span>
                          <span><strong>{issue.category}:</strong> {issue.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImagePlus className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-lg text-gray-700 font-medium mb-1">Share your moments</p>
          <p className="text-sm text-gray-500 mb-4">Drag photos and videos here</p>
          <Button 
            variant="secondary"
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            Select from computer
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            Supported: MP4, MOV, AVI, JPG, PNG, GIF
          </p>
          <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
            <Shield className="h-3 w-3 mr-1" />
            Protected by AI content moderation
          </div>
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <FileType className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {getFileType(selectedFile)} • {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancelSelection}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
              disabled={moderationStatus === "analyzing"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {renderModerationStatus()}

          {uploadProgress > 0 && moderationStatus === "approved" ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-gray-500 text-right">{uploadProgress}% uploaded</p>
            </div>
          ) : moderationStatus === "approved" ? (
            <Button 
              onClick={handleUpload} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Share
            </Button>
          ) : moderationStatus === "blocked" ? (
            <Button 
              onClick={handleCancelSelection}
              variant="outline" 
              className="w-full"
            >
              Try Different Content
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
