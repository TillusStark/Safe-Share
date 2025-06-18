
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useOnClickOutside } from "@/hooks/use-click-outside";

interface SearchResult {
  type: 'user' | 'post' | 'hashtag';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  image?: string;
}

export const GlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(searchRef, () => {
    setShowResults(false);
  });

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results: SearchResult[] = [];

        // Search users
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${searchQuery}%`)
          .limit(3);

        if (!usersError && users) {
          results.push(...users.map(user => ({
            type: 'user' as const,
            id: user.id,
            title: `@${user.username}`,
            subtitle: 'User',
            avatar: user.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${user.username}`
          })));
        }

        // Search posts by caption with manual join
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select(`
            id, 
            caption, 
            image_url,
            user_id
          `)
          .ilike("caption", `%${searchQuery}%`)
          .limit(3);

        if (!postsError && posts) {
          // Get user profiles for the posts
          const userIds = posts.map(post => post.user_id);
          const { data: postProfiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          const profileMap = new Map(postProfiles?.map(profile => [profile.id, profile]) || []);

          results.push(...posts.map(post => {
            const profile = profileMap.get(post.user_id);
            return {
              type: 'post' as const,
              id: post.id,
              title: post.caption || 'Untitled post',
              subtitle: profile ? `by @${profile.username}` : 'by unknown user',
              image: post.image_url
            };
          }));
        }

        // Search hashtags (extract from captions)
        if (searchQuery.startsWith('#')) {
          const hashtag = searchQuery.slice(1);
          const { data: hashtagPosts, error: hashtagError } = await supabase
            .from("posts")
            .select("id, caption")
            .ilike("caption", `%#${hashtag}%`)
            .limit(5);

          if (!hashtagError && hashtagPosts && hashtagPosts.length > 0) {
            results.push({
              type: 'hashtag' as const,
              id: hashtag,
              title: `#${hashtag}`,
              subtitle: `${hashtagPosts.length} posts`
            });
          }
        }

        setSearchResults(results);
      } catch (err) {
        console.error("Search exception:", err);
        toast({
          variant: "destructive",
          title: "Search failed",
          description: "There was an error performing the search.",
        });
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, toast]);

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery("");
    
    switch (result.type) {
      case 'user':
        navigate(`/profile/${result.id}`);
        break;
      case 'post':
        // For now, just show a toast. Later we can implement post detail page
        toast({
          title: "Post selected",
          description: result.title,
        });
        break;
      case 'hashtag':
        navigate(`/explore?hashtag=${result.id}`);
        break;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users, posts, #hashtags..."
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
          className="pl-8 w-full md:w-80 bg-gray-50"
        />
      </div>

      {showResults && (
        <div className="absolute w-full z-20 mt-1 bg-white rounded-md shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((result, index) => (
                <li
                  key={`${result.type}-${result.id}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-3 p-3">
                    {result.type === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar} alt={result.title} />
                        <AvatarFallback>
                          {result.title[1]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {result.type === 'post' && result.image && (
                      <img 
                        src={result.image} 
                        alt={result.title}
                        className="h-8 w-8 object-cover rounded"
                      />
                    )}
                    {result.type === 'hashtag' && (
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold">#</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500">{result.subtitle}</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-gray-500">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
