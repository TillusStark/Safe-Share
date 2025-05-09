
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useOnClickOutside } from "@/hooks/use-click-outside";

export const ProfileSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(searchRef, () => {
    setShowResults(false);
  });

  useEffect(() => {
    const searchProfiles = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${searchQuery}%`)
          .order("username")
          .limit(5);

        if (error) {
          console.error("Search error:", error);
          toast({
            variant: "destructive",
            title: "Search failed",
            description: "There was an error performing the search.",
          });
        } else {
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error("Search exception:", err);
      } finally {
        setIsSearching(false);
      }
    };

    // Use a debounce to avoid too many requests
    const timer = setTimeout(() => {
      searchProfiles();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, toast]);

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    }
  };

  const navigateToProfile = (userId: string) => {
    setShowResults(false);
    setSearchQuery("");
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setShowResults(true);
            } else {
              setShowResults(false);
            }
          }}
          onFocus={handleInputFocus}
          className="pl-8 w-full md:w-64 bg-gray-50"
        />
      </div>

      {showResults && (
        <div className="absolute w-full z-20 mt-1 bg-white rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((profile) => (
                <li
                  key={profile.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToProfile(profile.id)}
                >
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-8 w-8">
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
                    <span className="text-sm font-medium">@{profile.username}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-gray-500">No users found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProfileSearch;
