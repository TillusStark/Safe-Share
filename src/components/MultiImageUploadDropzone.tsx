
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MultiImageUploadDropzoneProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
}

const MultiImageUploadDropzone = ({ onUpload, maxFiles = 10 }: MultiImageUploadDropzoneProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
  }, [selectedFiles, maxFiles]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxFiles: maxFiles - selectedFiles.length,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false)
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (currentImageIndex >= newFiles.length) {
      setCurrentImageIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        onUpload(selectedFiles);
      }
    }, 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (selectedFiles.length === 0) {
    return (
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
        <p className="text-lg text-gray-700 font-medium mb-1">Share multiple photos</p>
        <p className="text-sm text-gray-500 mb-4">Drag photos here or click to select (up to {maxFiles})</p>
        <Button 
          variant="secondary"
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          Select from computer
        </Button>
        <p className="text-xs text-gray-400 mt-4">
          Supported: JPG, PNG, GIF
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 bg-white">
      {/* Image Preview */}
      <div className="relative mb-4">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={URL.createObjectURL(selectedFiles[currentImageIndex])}
            alt={`Preview ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
        
        {selectedFiles.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setCurrentImageIndex(Math.min(selectedFiles.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === selectedFiles.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {currentImageIndex + 1} / {selectedFiles.length}
            </div>
          </>
        )}
      </div>

      {/* File List */}
      <div className="space-y-2 mb-4">
        {selectedFiles.map((file, index) => (
          <div key={index} className={`flex items-center justify-between p-2 rounded ${index === currentImageIndex ? 'bg-purple-50' : 'bg-gray-50'}`}>
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentImageIndex(index)}>
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mr-3">
                <ImagePlus className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeFile(index)}
              className="h-6 w-6 text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add More Button */}
      {selectedFiles.length < maxFiles && (
        <div
          {...getRootProps()}
          className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-300 mb-4"
        >
          <input {...getInputProps()} />
          <p className="text-sm text-gray-600">Add more photos ({selectedFiles.length}/{maxFiles})</p>
        </div>
      )}

      {/* Upload Progress or Button */}
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
          Share {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
};

export default MultiImageUploadDropzone;
