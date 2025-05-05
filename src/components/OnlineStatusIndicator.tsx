
import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OnlineStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: "Your connection has been restored",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "You're offline",
        description: "Please check your internet connection",
      });
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  // Only render when offline
  return (
    <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 px-3 py-2 rounded-full flex items-center shadow-lg z-50">
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">Offline</span>
    </div>
  );
};

export default OnlineStatusIndicator;
