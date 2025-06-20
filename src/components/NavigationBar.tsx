
import { Link, useNavigate } from "react-router-dom";
import { Camera, Home, Search, User, Upload, Library, Compass, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import MessagingDialog from "./MessagingDialog";
import DarkModeToggle from "./DarkModeToggle";

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">SafeShare</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <GlobalSearch />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/">
                      <Home className="h-5 w-5" />
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/explore">
                      <Compass className="h-5 w-5" />
                    </Link>
                  </Button>

                  <NotificationBell />
                  
                  <MessagingDialog />

                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/upload">
                      <Upload className="h-5 w-5" />
                    </Link>
                  </Button>

                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/library">
                      <Library className="h-5 w-5" />
                    </Link>
                  </Button>

                  <DarkModeToggle />
                </div>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
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
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/explore">
                      <Search className="h-5 w-5" />
                    </Link>
                  </Button>
                  <NotificationBell />
                  <MessagingDialog />
                  <DarkModeToggle />
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <DarkModeToggle />
                <Button variant="outline" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {user && (
          <div className="md:hidden pb-3">
            <GlobalSearch />
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
