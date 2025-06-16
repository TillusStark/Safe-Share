
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Profile from "@/pages/Profile";
import Upload from "@/pages/Upload";
import Library from "@/pages/Library";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Explore from "@/pages/Explore";
import OnlineStatusIndicator from "@/components/OnlineStatusIndicator";
import { TooltipProvider } from "@/components/ui/tooltip";
import UserProfile from "@/pages/UserProfile";

const App = () => {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/library" element={<Library />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <OnlineStatusIndicator />
      </Router>
    </TooltipProvider>
  );
};

export default App;
