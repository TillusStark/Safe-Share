
import { HomeIcon, UploadIcon, UserCircle, Library, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ProfileSearch from "./ProfileSearch";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();
  const { isAdmin } = useAdminAuth();
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
        
        <div className="flex-1 max-w-sm mx-4 hidden md:block">
          {user && <ProfileSearch />}
        </div>
        
        <div className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Home">
                <HomeIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Home</TooltipContent>
          </Tooltip>
          
          {user && isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} aria-label="Admin">
                  <Shield className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Admin</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/upload")} aria-label="Upload">
                <UploadIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/library")} aria-label="Library">
                <Library className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Library</TooltipContent>
          </Tooltip>
          
          {user ? (
            <>
              {/* User is logged in */}
              <div className="flex items-center gap-3">
                {profile?.username && (
                  <span className="text-sm font-medium hidden md:block text-purple-600">
                    @{profile.username}
                  </span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>Profile</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleLogout}
                      aria-label="Logout"
                    >
                      <LogOut className="h-5 w-5 text-gray-500 hover:text-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
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
          
          <div className="md:hidden">
            {user && <ProfileSearch />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
