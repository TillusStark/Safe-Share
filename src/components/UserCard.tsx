
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import FollowButton from "@/components/FollowButton";
import FollowerCounter from "@/components/FollowerCounter";
import { useNavigate } from "react-router-dom";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  showFollowButton?: boolean;
  showFollowerCount?: boolean;
  className?: string;
}

const UserCard = ({ 
  user, 
  showFollowButton = true, 
  showFollowerCount = true,
  className = "" 
}: UserCardProps) => {
  const navigate = useNavigate();

  const handleUserClick = () => {
    navigate(`/profile/${user.id}`);
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Avatar 
          className="w-12 h-12 cursor-pointer" 
          onClick={handleUserClick}
        >
          <AvatarImage
            src={
              user.avatar_url ||
              `https://api.dicebear.com/8.x/identicon/svg?seed=${user.username}`
            }
            alt={user.username}
          />
          <AvatarFallback>
            {user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-sm cursor-pointer hover:underline truncate"
            onClick={handleUserClick}
          >
            {user.username}
          </h3>
          {showFollowerCount && (
            <FollowerCounter 
              userId={user.id} 
              showFollowing={false}
              className="text-xs"
            />
          )}
        </div>

        {showFollowButton && (
          <FollowButton userId={user.id} size="sm" />
        )}
      </div>
    </Card>
  );
};

export default UserCard;
