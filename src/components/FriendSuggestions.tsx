
import { useState, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import FollowButton from "./FollowButton";

interface UserSuggestion {
  id: string;
  username: string;
  avatar_url?: string;
  followers_count: number;
  mutual_followers?: number;
}

export const FriendSuggestions = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      // Get users that the current user is not following and exclude blocked users
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, followers_count")
        .neq("id", user.id)
        .limit(5);

      if (error) throw error;

      // Filter out users already being followed
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = new Set(following?.map(f => f.following_id) || []);

      // Filter out blocked users
      const { data: blocked } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user.id);

      const blockedIds = new Set(blocked?.map(b => b.blocked_id) || []);

      const filteredSuggestions = (profiles || [])
        .filter(profile => !followingIds.has(profile.id) && !blockedIds.has(profile.id))
        .slice(0, 3);

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error("Error fetching friend suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return null;

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold">Suggested for you</h3>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => navigate(`/profile/${suggestion.id}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    suggestion.avatar_url ||
                    `https://api.dicebear.com/8.x/identicon/svg?seed=${suggestion.username}`
                  }
                  alt={suggestion.username}
                />
                <AvatarFallback>
                  {suggestion.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">@{suggestion.username}</p>
                <p className="text-xs text-gray-500">
                  {suggestion.followers_count} followers
                </p>
              </div>
            </div>
            <FollowButton userId={suggestion.id} size="sm" />
          </div>
        ))}
      </div>
      <Button 
        variant="ghost" 
        className="w-full mt-3 text-purple-600 hover:text-purple-700"
        onClick={() => navigate("/explore")}
      >
        See all suggestions
      </Button>
    </Card>
  );
};

export default FriendSuggestions;
