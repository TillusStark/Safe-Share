import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import NavigationBar from "@/components/NavigationBar";
import { Bookmark } from "lucide-react";
import { fetchProfiles, getAvatarUrl } from "@/utils/profileUtils";

type SavedPost = {
  id: string;
  post_id: string;
  created_at: string;
  post: {
    id: string;
    image_url: string;
    caption: string;
    user_id: string;
    created_at: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
  }
};

const Library = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchSaved() {
      setLoading(true);
      try {
        // Get saved_posts and join with post fields
        const { data: savedData, error } = await supabase
          .from("saved_posts")
          .select(`
            id, post_id, created_at,
            post:posts (
              id, image_url, caption, user_id, created_at
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) {
          throw error;
        }

        // Filter out any null posts first
        const validSavedData = (savedData || []).filter(row => row.post);
        
        // Get all unique user IDs from posts to fetch their profiles in a single query
        const userIds = [...new Set(validSavedData.map(row => row.post.user_id))];
        
        // Fetch profiles for all authors at once using the utility function
        const profilesMap = await fetchProfiles(userIds);

        // Map the posts with author information
        setPosts(
          validSavedData.map(row => {
            const profile = profilesMap[row.post.user_id];
            const username = profile?.username || "Unknown";
            
            return {
              ...row,
              post: {
                ...row.post,
                authorUsername: username,
                authorName: username,
                authorAvatar: getAvatarUrl(profile),
              }
            };
          })
        );
      } catch (e) {
        console.error("Failed to load saved posts", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load saved posts.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-lg font-semibold text-center">Please log in to view your Library.</div>
          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => navigate("/login")}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="pt-20 pb-8 max-w-xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Bookmark className="w-6 h-6 text-purple-600" />
          Your Library
        </h1>
        {loading ? (
          <div>
            {[...Array(2)].map((_, idx) => (
              <Card key={idx} className="mb-4 border-0 shadow-sm">
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
        ) : posts.length ? (
          <div className="space-y-6">
            {posts.map(row => (
              <Card key={row.id} className="border-0 shadow-sm">
                <CardHeader className="flex-row items-center space-x-4 space-y-0 p-4">
                  <Link to={`/profile/${row.post.user_id}`}>
                    <img
                      src={row.post.authorAvatar}
                      alt={row.post.authorName}
                      className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </Link>
                  <Link to={`/profile/${row.post.user_id}`} className="font-semibold hover:underline">
                    {row.post.authorUsername}
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <img
                    src={row.post.image_url}
                    alt={row.post.caption || "Saved post"}
                    className="w-full aspect-square object-cover"
                  />
                </CardContent>
                <CardFooter className="flex flex-col items-start p-4 space-y-3">
                  <div>
                    <Link to={`/profile/${row.post.user_id}`} className="font-semibold mr-2 hover:underline">
                      {row.post.authorUsername}
                    </Link>
                    {row.post.caption}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Saved at {new Date(row.created_at).toLocaleString()}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            Nothing in your Library yet!<br />
            Save your favorite posts to see them here.
          </div>
        )}
      </main>
    </div>
  );
};
export default Library;
