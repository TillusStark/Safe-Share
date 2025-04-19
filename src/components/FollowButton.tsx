
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  isFollowing: boolean;
  onFollow: () => Promise<void>;
  onUnfollow: () => Promise<void>;
}

const FollowButton = ({ isFollowing, onFollow, onUnfollow }: FollowButtonProps) => {
  const handleClick = async () => {
    try {
      if (isFollowing) {
        await onUnfollow();
        toast.success("Unfollowed successfully");
      } else {
        await onFollow();
        toast.success("Following successfully");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <Button 
      onClick={handleClick}
      variant={isFollowing ? "outline" : "default"}
      className={isFollowing ? "" : "bg-purple-600 hover:bg-purple-700"}
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
