import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Grid3X3, Settings } from "lucide-react";
import { Post } from "@/types/post";
import type { Profile as ProfileType } from "@/types/profile";

// Temporary mock data - in a real app this would come from an API
const mockProfile: ProfileType = {
  id: "1",
  username: "john_doe",
  name: "John Doe",
  avatar: "https://picsum.photos/200",
  bio: "📸 Photography enthusiast | Travel lover 🌎 | Coffee addict ☕",
  postsCount: 42,
  followersCount: 1234,
  followingCount: 567,
};

const mockPosts: Post[] = [
  {
    id: "1",
    imageUrl: "https://picsum.photos/600/600",
    caption: "Beautiful sunset at the beach! 🌅",
    author: {
      name: mockProfile.username,
      avatar: mockProfile.avatar,
    },
    likes: 123,
    timestamp: "2h ago",
  },
  {
    id: "2",
    imageUrl: "https://picsum.photos/601/600",
    caption: "Coffee time ☕️",
    author: {
      name: mockProfile.username,
      avatar: mockProfile.avatar,
    },
    likes: 89,
    timestamp: "4h ago",
  },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-600">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="pt-20 pb-8 max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={mockProfile.avatar} alt={mockProfile.username} />
              <AvatarFallback>{mockProfile.username[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">{mockProfile.username}</h2>
                <div className="flex gap-2">
                  <Button className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700">
                    Follow
                  </Button>
                  <Button variant="outline">Message</Button>
                </div>
              </div>
              
              <div className="flex justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center">
                  <div className="font-semibold">{mockProfile.postsCount}</div>
                  <div className="text-gray-500 text-sm">posts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{mockProfile.followersCount}</div>
                  <div className="text-gray-500 text-sm">followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{mockProfile.followingCount}</div>
                  <div className="text-gray-500 text-sm">following</div>
                </div>
              </div>
              
              <div>
                <div className="font-semibold">{mockProfile.name}</div>
                <p className="text-gray-600">{mockProfile.bio}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {mockPosts.map((post) => (
            <Card key={post.id} className="aspect-square overflow-hidden border-0">
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Grid3X3 className="text-white w-6 h-6" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
