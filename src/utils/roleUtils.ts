
import { supabase } from "@/integrations/supabase/client";

export const checkUserRole = async (userId: string, role: 'admin' | 'user'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: role
    });

    if (error) {
      console.error("Error checking user role:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
};

export const getCurrentUserRole = async (): Promise<'admin' | 'user' | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const isAdmin = await checkUserRole(user.id, 'admin');
    return isAdmin ? 'admin' : 'user';
  } catch (error) {
    console.error("Error getting current user role:", error);
    return null;
  }
};
