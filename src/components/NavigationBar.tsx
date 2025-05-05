
import { HomeIcon, UploadIcon, UserCircle, Library, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile data when user is logged in
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        setProfile(data);
      });
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out",
      });
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <div className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          className="text-xl font-bold text-purple-600 cursor-pointer" 
          onClick={() => navigate("/")}
        >
          SafeShare
        </h1>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Home">
            <HomeIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/upload")} title="Upload">
            <UploadIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/library")} title="Library">
            <Library className="h-5 w-5" />
          </Button>
          
          {user ? (
            <>
              {/* User is logged in */}
              <div className="flex items-center gap-3">
                <Avatar 
                  className="cursor-pointer h-8 w-8 border-2 border-purple-200 hover:border-purple-400 transition-colors"
                  onClick={() => navigate("/profile")}
                >
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-gray-500 hover:text-red-500" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* User is not logged in */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/login")}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Login
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
