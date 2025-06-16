
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

export interface FollowData {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export function useFollow(targetUserId: string) {
  const { user } = useSupabaseAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus();
      fetchFollowCounts();
    } else {
      setLoading(false);
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking follow status:", error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const fetchFollowCounts = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("followers_count, following_count")
        .eq("id", targetUserId)
        .single();

      if (error) {
        console.error("Error fetching follow counts:", error);
        return;
      }

      setFollowersCount(data?.followers_count || 0);
      setFollowingCount(data?.following_count || 0);
    } catch (error) {
      console.error("Error fetching follow counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const follow = async () => {
    if (!user || !targetUserId) {
      toast.error("Please log in to follow users");
      return;
    }

    if (user.id === targetUserId) {
      toast.error("You cannot follow yourself");
      return;
    }

    try {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;

      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
      throw error;
    }
  };

  const unfollow = async () => {
    if (!user || !targetUserId) return;

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;

      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
      throw error;
    }
  };

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    follow,
    unfollow
  };
}
