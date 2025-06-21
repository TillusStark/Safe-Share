
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import StoryViewer from "./StoryViewer";
import CreateStoryDialog from "./CreateStoryDialog";

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

const StoriesCarousel = () => {
  const { user } = useSupabaseAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockStories: Story[] = [
      {
        id: "1",
        user: {
          id: "user1",
          username: "alice_photos",
          avatar: "https://api.dicebear.com/8.x/identicon/svg?seed=alice"
        },
        image_url: "https://picsum.photos/400/600?random=1",
        created_at: new Date().toISOString(),
        viewed: false
      },
      {
        id: "2",
        user: {
          id: "user2",
          username: "bob_captures",
          avatar: "https://api.dicebear.com/8.x/identicon/svg?seed=bob"
        },
        image_url: "https://picsum.photos/400/600?random=2",
        created_at: new Date().toISOString(),
        viewed: true
      },
      {
        id: "3",
        user: {
          id: "user3",
          username: "charlie_lens",
          avatar: "https://api.dicebear.com/8.x/identicon/svg?seed=charlie"
        },
        image_url: "https://picsum.photos/400/600?random=3",
        created_at: new Date().toISOString(),
        viewed: false
      },
      {
        id: "4",
        user: {
          id: "user4",
          username: "diana_shots",
          avatar: "https://api.dicebear.com/8.x/identicon/svg?seed=diana"
        },
        image_url: "https://picsum.photos/400/600?random=4",
        created_at: new Date().toISOString(),
        viewed: false
      },
      {
        id: "5",
        user: {
          id: "user5",
          username: "evan_photography",
          avatar: "https://api.dicebear.com/8.x/identicon/svg?seed=evan"
        },
        image_url: "https://picsum.photos/400/600?random=5",
        created_at: new Date().toISOString(),
        viewed: true
      }
    ];
    setStories(mockStories);
  }, []);

  const scrollStories = (direction: 'left' | 'right') => {
    const container = document.getElementById('stories-container');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    const container = document.getElementById('stories-container');
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
    }
  };

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
  };

  const handleCloseStoryViewer = () => {
    setSelectedStoryIndex(null);
  };

  const handleNextStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  const markStoryAsViewed = (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId ? { ...story, viewed: true } : story
    ));
  };

  const handleCreateStory = (imageFile: File) => {
    const newStory: Story = {
      id: `story-${Date.now()}`,
      user: {
        id: user?.id || 'current-user',
        username: user?.email?.split('@')[0] || 'You',
        avatar: `https://api.dicebear.com/8.x/identicon/svg?seed=${user?.email}`
      },
      image_url: URL.createObjectURL(imageFile),
      created_at: new Date().toISOString(),
      viewed: false
    };
    
    setStories(prev => [newStory, ...prev]);
    setShowCreateDialog(false);
  };

  useEffect(() => {
    const container = document.getElementById('stories-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [stories]);

  return (
    <>
      <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Stories</h3>
          <div className="flex space-x-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollStories('left')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollStories('right')}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div
          id="stories-container"
          className="flex space-x-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Add Story Button */}
          {user && (
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-600">
                  <AvatarImage src={`https://api.dicebear.com/8.x/identicon/svg?seed=${user.email}`} />
                  <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  onClick={() => setShowCreateDialog(true)}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[60px] truncate">Your story</span>
            </div>
          )}

          {/* Stories */}
          {stories.map((story, index) => (
            <div 
              key={story.id} 
              className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleStoryClick(index)}
            >
              <div className={`relative p-0.5 rounded-full ${story.viewed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
                <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800">
                  <AvatarImage src={story.user.avatar} />
                  <AvatarFallback>{story.user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[60px] truncate">{story.user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          story={stories[selectedStoryIndex]}
          onClose={handleCloseStoryViewer}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
          onMarkAsViewed={markStoryAsViewed}
          hasNext={selectedStoryIndex < stories.length - 1}
          hasPrev={selectedStoryIndex > 0}
        />
      )}

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateStory={handleCreateStory}
      />
    </>
  );
};

export default StoriesCarousel;
