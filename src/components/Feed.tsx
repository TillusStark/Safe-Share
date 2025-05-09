import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Share2, Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Post } from "@/types/post";
import { toast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CommentsDialog from "./CommentsDialog";
import { fetchProfiles, getAvatarUrl } from "@/utils/profileUtils";

const Feed = () => {
  const { user } = useSupabaseAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load posts. Please try again later.",
          });
          setLoading(false);
          return;
        }

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Get all unique user IDs from posts
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        
        // Fetch profiles for all post authors in one query
        const profileMap = await fetchProfiles(userIds);

        // Fetch saved posts if user is logged in
        let savedPostIds: string[] = [];
        if (user) {
          const { data: saved, error: savedError } = await supabase
            .from("saved_posts")
            .select("post_id")
            .eq("user_id", user.id);

          if (savedError) {
            console.error("Error fetching saved posts:", savedError);
          } else {
            savedPostIds = saved ? saved.map((row) => row.post_id) : [];
          }
        }

        // Transform posts data with author information
        const transformedPosts = postsData.map(post => {
          const profile = profileMap[post.user_id];
          const username = profile?.username || "Unknown";
          
          return {
            id: post.id,
            imageUrl: post.image_url,
            caption: post.caption || "",
            author: {
              id: post.user_id,
              name: username,
              username: username,
              avatar: getAvatarUrl(profile),
            },
            likes: 0,
            timestamp: new Date(post.created_at).toLocaleString(),
            liked: false,
            saved: savedPostIds.includes(post.id),
          };
        });

        setPosts(transformedPosts);
      } catch (error) {
        console.error("Unexpected error fetching posts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [user]);

  const handleLike = useCallback((id: string) => {
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
  }, [user]);

  const handleShare = useCallback(async (post: Post) => {
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
  }, []);

  const handleOpenComments = useCallback((post: Post) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsOpen(false);
    setSelectedPost(null);
  }, []);

  const handleSave = useCallback(async (post: Post) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "You need to login to save posts.",
      });
      return;
    }
    setSaving(post.id);

    if (!post.saved) {
      const { error } = await supabase
        .from("saved_posts")
        .insert([
          {
            user_id: user.id,
            post_id: post.id,
          }
        ]);
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not save post. Please try again.",
        });
      } else {
        setPosts(prev =>
          prev.map(p => p.id === post.id ? { ...p, saved: true } : p)
        );
        toast({
          title: "Saved",
          description: "Post saved to your Library.",
        });
      }
    } else {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", post.id);
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not remove from Library. Please try again.",
        });
      } else {
        setPosts(prev =>
          prev.map(p => p.id === post.id ? { ...p, saved: false } : p)
        );
        toast({
          title: "Removed",
          description: "Post removed from your Library.",
        });
      }
    }

    setSaving("");
  }, [user]);

  const renderLoadingSkeleton = () => (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center space-x-4 space-y-0 p-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-24 h-6 rounded" />
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="w-full aspect-square" />
          </CardContent>
          <CardFooter className="flex flex-col items-start p-4 space-y-3">
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="max-w-xl mx-auto py-32 text-center text-gray-500">
      No posts yet. Be the first to share something!
    </div>
  );

  const renderPosts = () => (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      {posts.map((post) => (
        <Card key={post.id} className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center space-x-4 space-y-0 p-4">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="font-semibold">{post.author.name}</span>
              <span className="text-sm text-gray-500">@{post.author.username}</span>
            </div>
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
                <Button variant="ghost" size="icon" onClick={() => handleOpenComments(post)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h.01M12 12h.01M16 12h.01" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleShare(post)}>
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant={post.saved ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => handleSave(post)}
                      disabled={!user || saving === post.id}
                      aria-label={user ? (post.saved ? "Unsave" : "Save") : "Login to save"}
                    >
                      <Bookmark className="h-6 w-6" fill={post.saved ? "currentColor" : "none"} />
                    </Button>
                  </span>
                </TooltipTrigger>
                {!user && (
                  <TooltipContent side="top">
                    Login to save posts
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <div>
              <p className="font-semibold">{post.likes} likes</p>
              <p>
                <span className="font-semibold mr-2">@{post.author.username}</span>
                {post.caption}
              </p>
              <p className="text-sm text-gray-500 mt-1">{post.timestamp}</p>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {loading && renderLoadingSkeleton()}
      {!loading && !posts.length && renderEmptyState()}
      {!loading && posts.length > 0 && renderPosts()}
      <CommentsDialog 
        open={commentsOpen}
        onOpenChange={open => {
          if (!open) handleCloseComments();
        }}
        post={selectedPost}
      />
    </>
  );
};

export default Feed;
