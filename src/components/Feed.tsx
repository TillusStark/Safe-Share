import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Post } from "@/types/post";
import { toast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mockPostsData: Post[] = [
  {
    id: "1",
    imageUrl: "https://picsum.photos/600/600",
    caption: "Beautiful sunset at the beach! 🌅",
    author: {
      name: "john_doe",
      avatar: "https://picsum.photos/50/50",
    },
    likes: 123,
    timestamp: "2h ago",
  },
  {
    id: "2",
    imageUrl: "https://picsum.photos/601/600",
    caption: "Coffee time ☕️",
    author: {
      name: "coffee_lover",
      avatar: "https://picsum.photos/51/51",
    },
    likes: 89,
    timestamp: "4h ago",
  },
];

const Feed = () => {
  const { user } = useSupabaseAuth();
  const [posts, setPosts] = useState<Post[]>(
    mockPostsData.map(post => ({ ...post, liked: false }))
  );

  const handleLike = (id: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "You need to login to like posts.",
      });
      return;
    }
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === id) {
          const liked = !post.liked;
          return { 
            ...post, 
            liked,
            likes: liked ? post.likes + 1 : post.likes - 1 
          };
        }
        return post;
      })
    );
    
    toast({
      title: "Success",
      description: "Like status updated",
      duration: 2000,
    });
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this post by ${post.author.name}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Share this post',
          text: shareText,
          url: shareUrl,
        });
        
        toast({
          title: "Shared successfully",
          description: "Post has been shared",
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        variant: "destructive",
        title: "Share failed",
        description: "Could not share this post. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      {posts.map((post) => (
        <Card key={post.id} className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center space-x-4 space-y-0 p-4">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="font-semibold">{post.author.name}</span>
          </CardHeader>
          <CardContent className="p-0">
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-full aspect-square object-cover"
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start p-4 space-y-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={post.liked ? "text-pink-500" : "hover:text-pink-500"}
                        onClick={() => handleLike(post.id)}
                        disabled={!user}
                        aria-label={user ? (post.liked ? "Unlike" : "Like") : "Login to like"}
                      >
                        <Heart className="h-6 w-6" fill={post.liked ? "currentColor" : "none"} />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!user && (
                    <TooltipContent side="top">
                      Login to like posts
                    </TooltipContent>
                  )}
                </Tooltip>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleShare(post)}>
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>
              <Button variant="ghost" size="icon">
                <Bookmark className="h-6 w-6" />
              </Button>
            </div>
            <div>
              <p className="font-semibold">{post.likes} likes</p>
              <p>
                <span className="font-semibold mr-2">{post.author.name}</span>
                {post.caption}
              </p>
              <p className="text-sm text-gray-500 mt-1">{post.timestamp}</p>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Feed;
