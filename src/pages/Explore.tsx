
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavigationBar from "@/components/NavigationBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Hash, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface HashtagData {
  hashtag: string;
  count: number;
}

const Explore = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<HashtagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'hashtags'>('trending');
  const selectedHashtag = searchParams.get('hashtag');

  useEffect(() => {
    fetchExploreData();
  }, [selectedHashtag]);

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      
      // Fetch posts (filtered by hashtag if specified)
      let postsQuery = supabase
        .from("posts")
        .select(`
          id,
          image_url,
          caption,
          created_at,
          profiles!inner(username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (selectedHashtag) {
        postsQuery = postsQuery.ilike("caption", `%#${selectedHashtag}%`);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load posts."
        });
      } else {
        setPosts(postsData || []);
      }

      // Extract hashtags from all posts
      if (!selectedHashtag) {
        const { data: allPosts, error: allPostsError } = await supabase
          .from("posts")
          .select("caption");

        if (!allPostsError && allPosts) {
          const hashtagMap = new Map<string, number>();
          
          allPosts.forEach(post => {
            if (post.caption) {
              const hashtags = post.caption.match(/#[\w]+/g);
              if (hashtags) {
                hashtags.forEach(tag => {
                  const cleanTag = tag.slice(1).toLowerCase();
                  hashtagMap.set(cleanTag, (hashtagMap.get(cleanTag) || 0) + 1);
                });
              }
            }
          });

          const sortedHashtags = Array.from(hashtagMap.entries())
            .map(([hashtag, count]) => ({ hashtag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

          setHashtags(sortedHashtags);
        }
      }
    } catch (error) {
      console.error("Error in fetchExploreData:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="pt-20 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="pt-20 pb-8 max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">
            {selectedHashtag ? `#${selectedHashtag}` : 'Explore'}
          </h1>
          
          {!selectedHashtag && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'trending' ? 'default' : 'outline'}
                onClick={() => setActiveTab('trending')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Button>
              <Button
                variant={activeTab === 'hashtags' ? 'default' : 'outline'}
                onClick={() => setActiveTab('hashtags')}
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                Hashtags
              </Button>
            </div>
          )}
        </div>

        {activeTab === 'hashtags' && !selectedHashtag && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Popular Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((item) => (
                <Badge
                  key={item.hashtag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-purple-100 text-sm py-2 px-3"
                  onClick={() => window.location.href = `/explore?hashtag=${item.hashtag}`}
                >
                  #{item.hashtag} ({item.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {posts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400">
              {selectedHashtag 
                ? `No posts found with #${selectedHashtag}` 
                : 'No posts to explore yet.'
              }
            </div>
          ) : (
            posts.map((post) => (
              <Card 
                key={post.id} 
                className="aspect-square overflow-hidden border-0 relative cursor-pointer group"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Grid3X3 className="text-white w-6 h-6" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">
                    @{post.profiles.username}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Explore;
