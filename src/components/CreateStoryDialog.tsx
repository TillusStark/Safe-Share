
import { useState, useCallback } from "react";
import { Upload, X, Image, Shield, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStory: (imageFile: File) => void;
}

type ModerationStatus = "idle" | "analyzing" | "approved" | "blocked";

const CreateStoryDialog = ({ open, onOpenChange, onCreateStory }: CreateStoryDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      const imageData = await fileToBase64(file);
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
            caption: "User story upload",
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
          title: "Story Content Blocked",
          description: "Your story violates our community guidelines and cannot be shared.",
          variant: "destructive",
        });
        return false;
      } else {
        setModerationStatus("approved");
        toast({
          title: "Story Approved",
          description: "Your story has been approved and is ready to share.",
        });
        return true;
      }
    } catch (error) {
      console.error("Story moderation error:", error);
      setModerationStatus("blocked");
      setModerationResult({
        status: "failed",
        issues: [{
          category: "System Error",
          description: "Unable to verify story safety. Upload blocked.",
          severity: "high"
        }]
      });
      toast({
        title: "Story Analysis Failed",
        description: "Unable to verify story safety. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Immediately start content analysis
    await analyzeContent(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCreate = () => {
    if (!selectedFile || moderationStatus !== "approved") return;
    
    onCreateStory(selectedFile);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDragging(false);
    setModerationStatus("idle");
    setModerationResult(null);
    onOpenChange(false);
  };

  const renderModerationStatus = () => {
    switch (moderationStatus) {
      case "analyzing":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-blue-800">AI Analyzing Story...</p>
                <p className="text-xs text-blue-600">Checking for safety violations</p>
              </div>
            </div>
          </div>
        );
      
      case "approved":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Story Approved</p>
                <p className="text-xs text-green-600">Safe to share</p>
              </div>
            </div>
          </div>
        );
      
      case "blocked":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-2">Story Blocked</p>
                <p className="text-xs text-red-600 mb-2">
                  Violates our community guidelines
                </p>
                {moderationResult?.issues && moderationResult.issues.length > 0 && (
                  <ul className="space-y-1">
                    {moderationResult.issues.map((issue: any, index: number) => (
                      <li key={index} className="text-xs text-red-600">
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create Story
            <Shield className="h-4 w-4 text-purple-600" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop an image here, or click to select
                </p>
                <label htmlFor="story-upload" className="cursor-pointer">
                  <Button variant="outline" className="mt-2" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </span>
                  </Button>
                  <input
                    id="story-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Maximum file size: 10MB
              </p>
              <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-1" />
                Protected by AI content moderation
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl!}
                  alt="Story preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleClose}
                  className="absolute top-2 right-2"
                  disabled={moderationStatus === "analyzing"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {renderModerationStatus()}
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  className="flex-1"
                  disabled={moderationStatus === "analyzing"}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  className="flex-1"
                  disabled={moderationStatus !== "approved"}
                >
                  {moderationStatus === "approved" ? "Share Story" : "Analyzing..."}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;
