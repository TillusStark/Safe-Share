
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, FileType, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
}

const UploadDropzone = ({ onUpload }: UploadDropzoneProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
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
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
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
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploadProgress > 0 ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-gray-500 text-right">{uploadProgress}% uploaded</p>
            </div>
          ) : (
            <Button 
              onClick={handleUpload} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Share
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
