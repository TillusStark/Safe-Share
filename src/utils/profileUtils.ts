
import { supabase } from "@/integrations/supabase/client";

export type ProfileInfo = {
  username: string;
  avatar_url: string | null;
};

export type ProfileMap = Record<string, ProfileInfo>;

// Fetch profiles for a list of user IDs
export async function fetchProfiles(userIds: string[]): Promise<ProfileMap> {
  // Remove any duplicates and null/undefined values
  const uniqueIds = [...new Set(userIds.filter(id => id))];
  
  if (uniqueIds.length === 0) {
    return {};
  }
  
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", uniqueIds);
      
    if (error) {
      console.error("Error fetching profiles:", error);
      return {};
    }
    
    // Create a map of profiles for easier lookup
    const profileMap: ProfileMap = {};
    
    profiles?.forEach(profile => {
      profileMap[profile.id] = {
        username: profile.username,
        avatar_url: profile.avatar_url
      };
    });
    
    return profileMap;
  } catch (error) {
    console.error("Failed to fetch profiles:", error);
    return {};
  }
}

// Get avatar URL (either from profile or generate a fallback)
export function getAvatarUrl(profile: ProfileInfo | undefined): string {
  if (profile?.avatar_url) {
    return profile.avatar_url;
  }
  
  const username = profile?.username || "Unknown";
  return `https://api.dicebear.com/8.x/identicon/svg?seed=${username}`;
}
