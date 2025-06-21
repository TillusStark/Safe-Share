import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Post } from "@/types/post";
import AIAnalysis from "./AIAnalysis";
import { Brain } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
}

const CommentsDialog: React.FC<CommentsDialogProps> = ({ open, onOpenChange, post }) => {
  // In real app, fetch comments for the post. Here we use mock data:
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addComment = () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setComments(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          author: "You",
          text: newComment,
          timestamp: new Date().toLocaleString(),
        },
      ]);
      setNewComment("");
      setSubmitting(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="mb-3">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.length === 0 && <div className="text-sm text-gray-400">No comments yet.</div>}
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm border-b pb-2 mb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="font-medium text-purple-700">{comment.author}:</span>{" "}
                    <span>{comment.text}</span>
                    <div className="text-xs text-gray-400">{comment.timestamp}</div>
                  </div>
                  <AIAnalysis
                    type="comment"
                    content={comment.text}
                    context={`Comment by ${comment.author} on post`}
                    trigger={
                      <Button variant="ghost" size="sm" className="ml-2 p-1">
                        <Brain className="h-3 w-3" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            disabled={submitting}
          />
          <div className="flex gap-2 mt-2">
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={addComment}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? "Posting..." : "Post"}
            </Button>
            {newComment.trim() && (
              <AIAnalysis
                type="comment"
                content={newComment}
                context="Draft comment before posting"
                trigger={
                  <Button variant="outline" size="sm">
                    <Brain className="h-4 w-4" />
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;
