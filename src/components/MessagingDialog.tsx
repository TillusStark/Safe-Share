
import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMessaging } from "@/hooks/useMessaging";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { formatDistanceToNow } from "date-fns";

export const MessagingDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const { user } = useSupabaseAuth();
  const { 
    conversations, 
    messages, 
    loading, 
    selectedConversation,
    fetchMessages,
    sendMessage,
    setSelectedConversation
  } = useMessaging();

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation || !conversation.other_user) return;

    await sendMessage(conversation.other_user.id, messageText);
    setMessageText("");
  };

  const handleConversationSelect = (conversationId: string) => {
    fetchMessages(conversationId);
  };

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Messages</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No conversations yet</div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedConversation === conversation.id ? 'bg-purple-50' : ''
                      }`}
                      onClick={() => handleConversationSelect(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={conversation.other_user?.avatar_url || 
                              `https://api.dicebear.com/8.x/identicon/svg?seed=${conversation.other_user?.username}`}
                            alt={conversation.other_user?.username}
                          />
                          <AvatarFallback>
                            {conversation.other_user?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              @{conversation.other_user?.username}
                            </p>
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <span className="bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          {conversation.last_message && (
                            <p className="text-xs text-gray-600 truncate">
                              {conversation.last_message.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? 'text-purple-100' : 'text-gray-500'
                          }`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingDialog;
