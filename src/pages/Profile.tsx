
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Grid3X3, ImagePlus } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { supabase } from "@/integrations/supabase/client";
import AvatarUploader from "@/components/AvatarUploader";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import FollowerCounter from "@/components/FollowerCounter";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useSupabaseAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            variant: "destructive",
            title: "Profile error",
            description: "Failed to load profile information"
          });
        }
        setProfile(data);
        setProfileLoading(false);
      });
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      setUserPosts([]);
      setPostsLoading(false);
      return;
    }
    
    setPostsLoading(true);
    supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching user posts:", error);
        }
        setUserPosts(data || []);
        setPostsLoading(false);
      });
  }, [user]);

  const handleAvatarUploaded = async (url: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      
      if (error) {
        throw error;
      }
      
      setProfile((prev: any) => ({ ...prev, avatar_url: url }));
      setShowAvatarUpload(false);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating avatar:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "There was a problem updating your avatar. Please try again.",
      });
    }
  };

  const handlePostClick = (postId: string) => {
    console.log("Post clicked:", postId);
    // You can implement navigation to the post detail page here
  };

  if (loading || profileLoading || postsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-lg font-semibold text-center">Please log in to view your profile.</div>
          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => navigate("/login")}>Login</Button>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user.id === profile?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="pt-20 pb-8 max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={
                    profile?.avatar_url ||
                    `https://api.dicebear.com/8.x/identicon/svg?seed=${profile?.username ?? user.email}`
                  }
                  alt={profile?.username ?? user.email}
                />
                <AvatarFallback>
                  {(profile?.username ?? user.email ?? "?")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -bottom-2 -right-2 bg-white border rounded-full shadow"
                  onClick={() => setShowAvatarUpload((v) => !v)}
                  type="button"
                  title="Change Avatar"
                >
                  <ImagePlus className="h-5 w-5 text-purple-600" />
                </Button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{profile?.username ?? user.email}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" type="button">Message</Button>
                </div>
              </div>
              <div>
                <div className="font-semibold">{user.email}</div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-gray-500">{userPosts.length} posts</div>
                  {user && <FollowerCounter userId={user.id} />}
                </div>
              </div>
            </div>
          </div>
          {showAvatarUpload && isOwnProfile && (
            <div className="mt-4">
              <AvatarUploader userId={user.id} onUploaded={handleAvatarUploaded} />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
          {userPosts.length === 0 && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 py-16 text-center text-gray-400">
              No posts yet. <a href="/upload" className="text-purple-600 hover:underline">Share your first post</a>
            </div>
          )}
          {userPosts.map((post) => (
            <Card 
              key={post.id} 
              className="aspect-square overflow-hidden border-0 relative cursor-pointer"
              onClick={() => handlePostClick(post.id)}
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

export default Profile;
