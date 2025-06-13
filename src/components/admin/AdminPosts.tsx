import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  caption: string;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  } | null;
}

const AdminPosts = () => {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchPosts();
    }
  }, [adminLoading, isAdmin]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log("Fetching posts from database...");
      
      // First fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        throw postsError;
      }

      console.log("Fetched posts:", postsData?.length || 0);

      // Then fetch profiles for all user_ids
      const userIds = postsData?.map(post => post.user_id) || [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }

        // Combine the data
        const postsWithProfiles = postsData?.map(post => {
          const profile = profilesData?.find(p => p.id === post.user_id);
          return {
            ...post,
            profiles: profile ? { username: profile.username } : null
          };
        }) || [];

        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) {
      toast.error("Unauthorized: Admin access required");
      return;
    }

    setDeletingPostId(postId);
    
    try {
      console.log("Attempting to delete post:", postId);
      
      // Delete from saved_posts first (if any references exist)
      const { error: savedPostsError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId);

      if (savedPostsError) {
        console.error("Error deleting saved post references:", savedPostsError);
        // Continue anyway, this might not exist
      }

      // Delete the main post
      const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        throw deleteError;
      }
      
      console.log("Post deleted successfully from database:", postId);
      
      // Remove the post from local state immediately
      setPosts(prevPosts => {
        const updatedPosts = prevPosts.filter(post => post.id !== postId);
        console.log("Updated posts count:", updatedPosts.length);
        return updatedPosts;
      });
      
      toast.success("Post deleted successfully");
      
      // Refetch posts to ensure consistency
      await fetchPosts();
      
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post: " + (error as Error).message);
      
      // Refetch posts to ensure UI is in sync with database
      await fetchPosts();
    } finally {
      setDeletingPostId(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Caption</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="w-12 h-12 object-cover rounded"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {post.profiles?.username || 'Unknown User'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {post.caption || 'No caption'}
                </TableCell>
                <TableCell>
                  {new Date(post.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={deletingPostId === post.id}
                        >
                          {deletingPostId === post.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePost(post.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No posts found matching your criteria
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
