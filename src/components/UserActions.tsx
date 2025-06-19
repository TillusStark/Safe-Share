
import { useState } from "react";
import { MoreHorizontal, UserX, Flag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface UserActionsProps {
  userId: string;
  username: string;
  onMessage?: () => void;
}

export const UserActions = ({ userId, username, onMessage }: UserActionsProps) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const handleBlock = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        });

      if (error) throw error;

      setIsBlocked(true);
      toast({
        title: "User blocked",
        description: `You have blocked @${username}`
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block user"
      });
    }
  };

  const handleUnblock = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", userId);

      if (error) throw error;

      setIsBlocked(false);
      toast({
        title: "User unblocked",
        description: `You have unblocked @${username}`
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock user"
      });
    }
  };

  const handleReport = async () => {
    if (!user || !reportReason) return;

    try {
      const { error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: userId,
          reason: reportReason,
          description: reportDescription || null
        });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe"
      });

      setReportDialogOpen(false);
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit report"
      });
    }
  };

  if (!user || user.id === userId) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onMessage && (
            <DropdownMenuItem onClick={onMessage}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={isBlocked ? handleUnblock : handleBlock}>
            <UserX className="h-4 w-4 mr-2" />
            {isBlocked ? 'Unblock' : 'Block'} User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report @{username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for reporting</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam">Spam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harassment" id="harassment" />
                  <Label htmlFor="harassment">Harassment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate_content" id="inappropriate" />
                  <Label htmlFor="inappropriate">Inappropriate Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake_account" id="fake" />
                  <Label htmlFor="fake">Fake Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide more context about why you're reporting this user..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReport} disabled={!reportReason}>
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserActions;
