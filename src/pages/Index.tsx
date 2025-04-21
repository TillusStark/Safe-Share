
import { Button } from "@/components/ui/button";
import { UserPlus, UploadIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Feed from "@/components/Feed";
import NavigationBar from "@/components/NavigationBar";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4 flex justify-end gap-2 mb-4">
          <Button onClick={() => navigate("/login")} variant="ghost">
            Login
          </Button>
          <Button onClick={() => navigate("/signup")} variant="ghost">
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Button>
          <Button onClick={() => navigate("/upload")} className="bg-purple-600 hover:bg-purple-700">
            <UploadIcon className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <Feed />
      </main>
    </div>
  );
};

export default Index;
