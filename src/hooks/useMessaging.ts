
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  last_message?: Message;
  unread_count?: number;
}

export function useMessaging() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchConversations();
    setupRealtimeSubscription();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Get other user profiles and last messages
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
          
          // Get other user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", otherUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("*")
            .or(`sender_id.eq.${conv.user1_id},sender_id.eq.${conv.user2_id}`)
            .or(`receiver_id.eq.${conv.user1_id},receiver_id.eq.${conv.user2_id}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("sender_id", otherUserId)
            .eq("read", false);

          return {
            ...conv,
            other_user: profile,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversations"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${conversation.user1_id},sender_id.eq.${conversation.user2_id}`)
        .or(`receiver_id.eq.${conversation.user1_id},receiver_id.eq.${conversation.user2_id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      setSelectedConversation(conversationId);

      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) return;

    try {
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create or update conversation
      const user1Id = user.id < receiverId ? user.id : receiverId;
      const user2Id = user.id < receiverId ? receiverId : user.id;

      const { error: convError } = await supabase
        .from("conversations")
        .upsert({
          user1_id: user1Id,
          user2_id: user2Id,
          last_message_at: new Date().toISOString()
        });

      if (convError) throw convError;

      // Refresh conversations and messages
      await fetchConversations();
      if (selectedConversation) {
        await fetchMessages(selectedConversation);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;

      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", otherUserId)
        .eq("read", false);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          fetchConversations(); // Refresh conversations to update last message
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    conversations,
    messages,
    loading,
    selectedConversation,
    fetchMessages,
    sendMessage,
    setSelectedConversation
  };
}
