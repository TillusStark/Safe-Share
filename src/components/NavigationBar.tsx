
import { HomeIcon, UploadIcon, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const NavigationBar = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 
          className="text-xl font-bold text-purple-600 cursor-pointer" 
          onClick={() => navigate("/")}
        >
          SafeShare
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <HomeIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/upload")}>
            <UploadIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <UserCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
