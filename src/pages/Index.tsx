
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Feed from "@/components/Feed";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-600">SafeShare</h1>
          <Button onClick={() => navigate("/upload")} className="bg-purple-600 hover:bg-purple-700">
            <UploadIcon className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </header>
      <main className="pt-20 pb-8">
        <Feed />
      </main>
    </div>
  );
};

export default Index;
