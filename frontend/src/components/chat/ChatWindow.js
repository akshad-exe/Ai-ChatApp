'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Trash2, Settings, Info, Plus, File, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chat';
import { userService } from '@/services/user';
import ChatList from './ChatList';
import Message from './Message';
import MessageInput from './MessageInput';
import CreateChatDialog from './CreateChatDialog.jsx';
import CreateGroupChatDialog from './CreateGroupChatDialog.jsx';

export default function ChatWindow() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [newChatUser, setNewChatUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        if (!authLoading && !isAuthenticated) {
          console.log('Authentication failed: Not authenticated');
          router.push('/login');
          return;
        }

        console.log('Authentication successful, loading chats');
        loadInitialData();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, authLoading, router]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Failed to load chats:', error);
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      const loadChatMessages = async () => {
        try {
          setIsLoading(true);
          console.log('Loading messages for chat:', selectedChat.id);
          const response = await chatService.getMessages(selectedChat.id);
          console.log('Messages loaded successfully:', response.data);
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to load messages:', error);
          if (error.response?.status === 401) {
            console.log('Unauthorized access, clearing token and redirecting');
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadChatMessages();
    }
  }, [selectedChat, router]);

  const handleSendMessage = async (text) => {
    if (!selectedChat) return;

    const newMessage = {
      id: Date.now(),
      text,
      sender: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      timestamp: new Date().toISOString(),
      status: 'sent',
      type: 'text',
    };

    setMessages([...messages, newMessage]);
    setIsTyping(true);

    try {
      console.log('Sending message:', text);
      await chatService.sendMessage(selectedChat.id, {
        content: text,
        type: 'text'
      });

      // Get AI response only for direct chats
      if (!selectedChat.isGroup) {
        console.log('Getting AI response...');
        const aiResponse = await chatService.getAIResponse(selectedChat.id, text);
        console.log('AI response received:', aiResponse);
        
        const aiMessage = {
          id: Date.now(),
          text: aiResponse.message,
          sender: {
            id: 'ai',
            name: 'AI Assistant',
            avatar: '/ai-avatar.png',
          },
          timestamp: new Date().toISOString(),
          type: 'text',
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized access, clearing token and redirecting');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendFile = async (file) => {
    if (!selectedChat) return;
    setPreviewFile(file);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'file');
      
      await chatService.sendMessage(selectedChat.id, {
        content: file.name,
        type: 'file',
        mediaUrl: URL.createObjectURL(file)
      });
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      console.error('Failed to send file:', error);
    }
  };

  const handleSendImage = async (file) => {
    if (!selectedChat) return;
    setPreviewFile(file);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      
      await chatService.sendMessage(selectedChat.id, {
        content: 'Image',
        type: 'image',
        mediaUrl: URL.createObjectURL(file)
      });
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      console.error('Failed to send image:', error);
    }
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await userService.searchUsers(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
      // You might want to show a toast or notification here
    }
  };

  const handleCreateChat = async (userId) => {
    try {
      const response = await chatService.createChat({ userId });
      setChats(prev => [...prev, response.data]);
      setSelectedChat(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      console.error('Failed to create chat:', error);
    }
  };

  const handleCreateGroupChat = async (groupData) => {
    try {
      setChats(prev => [...prev, groupData]);
      setSelectedChat(groupData);
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      console.error('Failed to create group chat:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    try {
      await chatService.deleteChat(selectedChat.id);
      setChats(prev => prev.filter(chat => chat.id !== selectedChat.id));
      setSelectedChat(null);
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      console.error('Failed to delete chat:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedChat?.isGroup) return;

    try {
      await chatService.leaveGroupChat(selectedChat.id);
      setChats(prev => prev.filter(chat => chat.id !== selectedChat.id));
      setSelectedChat(null);
    } catch (error) {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      console.error('Failed to leave group chat:', error);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-full bg-background">
      <div className="w-80 border-r bg-background">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chats</h2>
            <div className="flex items-center space-x-2">
              <CreateChatDialog onChatCreated={handleCreateChat} />
              <CreateGroupChatDialog onChatCreated={handleCreateGroupChat} />
            </div>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <ChatList
            chats={chats}
            onSelectChat={setSelectedChat}
            selectedChatId={selectedChat?.id}
          />
        </ScrollArea>
      </div>
      
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={selectedChat.avatar} alt={selectedChat.name} />
                  <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{selectedChat.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.isGroup ? `${selectedChat.participants?.length || 0} members` : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedChat.isGroup && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Users className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View members</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Start voice call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Start video call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Info className="mr-2 h-4 w-4" />
                      <span>View Info</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {selectedChat.isGroup ? (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={handleLeaveGroup}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Leave Group</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={handleDeleteChat}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Chat</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Container */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <Message
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.sender.id === user.id}
                    />
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <MessageInput
                onSendMessage={handleSendMessage}
                onSendFile={handleSendFile}
                onSendImage={handleSendImage}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Select a chat to start messaging</p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setIsCreateChatOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Chat
                </Button>
                <Button variant="outline" onClick={() => setIsCreateGroupOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Dialog */}
      <CreateChatDialog 
        isOpen={isCreateChatOpen} 
        onClose={() => setIsCreateChatOpen(false)} 
      />

      {/* Create Group Chat Dialog */}
      <CreateGroupChatDialog 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)} 
      />

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview File</DialogTitle>
            <DialogDescription>
              {previewFile?.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt="Preview"
                  className="max-w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <File className="h-8 w-8" />
                  <span>{previewFile?.name}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
} 