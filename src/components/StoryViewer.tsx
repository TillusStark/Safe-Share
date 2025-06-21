
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Story {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  image_url: string;
  created_at: string;
  viewed: boolean;
}

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMarkAsViewed: (storyId: string) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const StoryViewer = ({
  story,
  onClose,
  onNext,
  onPrev,
  onMarkAsViewed,
  hasNext,
  hasPrev
}: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const duration = 5000; // 5 seconds per story

  useEffect(() => {
    onMarkAsViewed(story.id);
  }, [story.id, onMarkAsViewed]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (hasNext) {
            onNext();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, hasNext, onNext, onClose, duration]);

  useEffect(() => {
    setProgress(0);
  }, [story.id]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    if (e.key === 'ArrowRight' && hasNext) onNext();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative max-w-md w-full h-full max-h-[80vh] bg-black rounded-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-2 left-2 right-2 z-10">
          <Progress value={progress} className="h-1 bg-gray-600" />
        </div>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 border border-white">
              <AvatarImage src={story.user.avatar} />
              <AvatarFallback className="text-xs">{story.user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white text-sm font-medium">{story.user.username}</p>
              <p className="text-gray-300 text-xs">{formatTime(story.created_at)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Story Image */}
        <div 
          className="relative w-full h-full cursor-pointer"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <img
            src={story.image_url}
            alt={`Story by ${story.user.username}`}
            className="w-full h-full object-cover"
          />
          
          {/* Click areas for navigation */}
          <div className="absolute inset-0 flex">
            {hasPrev && (
              <div 
                className="w-1/3 h-full cursor-pointer flex items-center justify-start pl-4"
                onClick={onPrev}
              >
                <ChevronLeft className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="flex-1" />
            {hasNext && (
              <div 
                className="w-1/3 h-full cursor-pointer flex items-center justify-end pr-4"
                onClick={onNext}
              >
                <ChevronRight className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons - Mobile */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between md:hidden">
          {hasPrev && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onPrev}
              className="bg-white/20 text-white border-white/30"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
          <div className="flex-1" />
          {hasNext && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNext}
              className="bg-white/20 text-white border-white/30"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
