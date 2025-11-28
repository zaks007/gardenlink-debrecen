import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read: boolean;
  garden_id: string | null;
}

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  unreadCount: number;
}

const Messages = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to view messages');
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      
      // Set up realtime subscription
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (
              (newMsg.sender_id === selectedConversation && newMsg.receiver_id === user?.id) ||
              (newMsg.receiver_id === selectedConversation && newMsg.sender_id === user?.id)
            ) {
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user?.id]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data?.flatMap(m => [m.sender_id, m.receiver_id]) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      if (error) throw error;

      // Group messages by conversation
      const convMap = new Map<string, Conversation>();
      
      data?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        const otherProfile = profileMap.get(otherUserId);
        const otherUserName = otherProfile?.full_name || 'Unknown';
        const otherUserEmail = otherProfile?.email || '';
        
        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            userId: otherUserId,
            userName: otherUserName,
            userEmail: otherUserEmail,
            lastMessage: msg.content,
            unreadCount: 0,
          });
        }
        
        if (msg.receiver_id === user?.id && !msg.read) {
          const conv = convMap.get(otherUserId)!;
          conv.unreadCount++;
        }
      });

      setConversations(Array.from(convMap.values()));
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user?.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);

      fetchConversations();
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        receiver_id: selectedConversation,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 px-4">
          <div className="animate-pulse h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Your conversations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => setSelectedConversation(conv.userId)}
                        className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                          selectedConversation === conv.userId ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {conv.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm truncate">{conv.userName}</p>
                              {conv.unreadCount > 0 && (
                                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle>
                    {conversations.find((c) => c.userId === selectedConversation)?.userName}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <CardContent className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={isSending}
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
