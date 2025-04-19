
import { Button } from "@/components/ui/button";
import { UploadIcon, UserCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Feed from "@/components/Feed";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-600">SafeShare</h1>
          <div className="flex gap-2">
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="pt-20 pb-8">
        <Feed />
      </main>
    </div>
  );
};

export default Index;
