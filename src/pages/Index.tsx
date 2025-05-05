
import { useNavigate } from "react-router-dom";
import Feed from "@/components/Feed";
import NavigationBar from "@/components/NavigationBar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Make sure auth state is loaded before rendering
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  if (!isReady) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="pt-20 pb-8">
        <Feed />
      </main>
    </div>
  );
};

export default Index;
