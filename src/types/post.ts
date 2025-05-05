
export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  likes: number;
  liked: boolean;
  timestamp: string;
  saved?: boolean;
}
