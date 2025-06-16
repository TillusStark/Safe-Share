
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface FollowButtonProps {
  userId: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const FollowButton = ({ userId, className, size = "default" }: FollowButtonProps) => {
  const { user } = useSupabaseAuth();
  const { isFollowing, loading, follow, unfollow } = useFollow(userId);

  // Don't show follow button for own profile or when not logged in
  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      size={size}
      className={`${isFollowing ? "" : "bg-purple-600 hover:bg-purple-700"} ${className}`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="mr-2 h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
