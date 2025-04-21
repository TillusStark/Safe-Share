
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";
import NavigationBar from "@/components/NavigationBar";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, loading, session } = useSupabaseAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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
        setProfile(data);
        setProfileLoading(false);
      });
  }, [user]);

  // Mock posts just for UI (until you add real posts support)
  const mockPosts = [
    {
      id: "1",
      imageUrl: "https://picsum.photos/600/600",
      caption: "Beautiful sunset at the beach! 🌅",
      likes: 123,
      timestamp: "2h ago",
    },
    {
      id: "2",
      imageUrl: "https://picsum.photos/601/600",
      caption: "Coffee time ☕️",
      likes: 89,
      timestamp: "4h ago",
    },
  ];

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-lg font-semibold text-center">Please log in to view your profile.</div>
          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = "/login"}>Login</Button>
        </Card>
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
              <AvatarImage src={`https://api.dicebear.com/8.x/identicon/svg?seed=${profile?.username ?? user.email}`} alt={profile?.username ?? user.email} />
              <AvatarFallback>{(profile?.username ?? user.email ?? "?")[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{profile?.username ?? user.email}</h2>
                <div className="flex gap-2">
                  {/* TODO: Add FollowButton if needed */}
                  <Button variant="outline">Message</Button>
                </div>
              </div>
              <div>
                <div className="font-semibold">{user.email}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {mockPosts.map((post) => (
            <Card key={post.id} className="aspect-square overflow-hidden border-0">
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
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
