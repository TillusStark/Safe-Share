

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  liked?: boolean;
  timestamp: string;
  saved?: boolean;
}

