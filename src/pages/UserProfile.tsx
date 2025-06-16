
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavigationBar from "@/components/NavigationBar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import FollowButton from "@/components/FollowButton";
import FollowerCounter from "@/components/FollowerCounter";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        if (!userId) {
          setNotFound(true);
          return;
        }

        // If viewing own profile, redirect to /profile
        if (user && userId === user.id) {
          navigate("/profile");
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !profileData) {
          console.error("Error fetching profile:", profileError);
          setNotFound(true);
          return;
        }

        setProfile(profileData);

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching user posts:", postsError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load user posts."
          });
        } else {
          setUserPosts(postsData || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, [userId, user, navigate, toast]);

  if (loading) {
    return (
      <div>
        <NavigationBar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <NavigationBar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
            <p className="mb-4">The user you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="pt-20 pb-8 max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={
                  profile.avatar_url ||
                  `https://api.dicebear.com/8.x/identicon/svg?seed=${profile.username}`
                }
                alt={profile.username}
              />
              <AvatarFallback>
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{profile.username}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" type="button">Message</Button>
                  <FollowButton userId={userId!} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <div className="text-gray-500">{userPosts.length} posts</div>
                  <FollowerCounter userId={userId!} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
          {userPosts.length === 0 && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 py-16 text-center text-gray-400">
              No posts yet.
            </div>
          )}
          {userPosts.map((post) => (
            <Card 
              key={post.id} 
              className="aspect-square overflow-hidden border-0 relative cursor-pointer"
            >
              <img
                src={post.image_url}
                alt={post.caption || "User post"}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Grid3X3 className="text-white w-6 h-6" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
