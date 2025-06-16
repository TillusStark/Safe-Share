
import { useFollow } from "@/hooks/useFollow";

interface FollowerCounterProps {
  userId: string;
  showFollowing?: boolean;
  className?: string;
}

const FollowerCounter = ({ userId, showFollowing = true, className = "" }: FollowerCounterProps) => {
  const { followersCount, followingCount, loading } = useFollow(userId);

  if (loading) {
    return <div className={`text-gray-500 ${className}`}>Loading...</div>;
  }

  return (
    <div className={`flex gap-4 text-sm ${className}`}>
      <div>
        <span className="font-semibold">{followersCount}</span>
        <span className="text-gray-500 ml-1">
          {followersCount === 1 ? 'follower' : 'followers'}
        </span>
      </div>
      {showFollowing && (
        <div>
          <span className="font-semibold">{followingCount}</span>
          <span className="text-gray-500 ml-1">following</span>
        </div>
      )}
    </div>
  );
};

export default FollowerCounter;
