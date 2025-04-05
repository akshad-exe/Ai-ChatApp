'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ChatList({ onSelectChat, selectedChatId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats] = useState([
    {
      id: 1,
      name: 'AI Assistant',
      lastMessage: 'How can I help you today?',
      timestamp: '2:30 PM',
      unread: 2,
      avatar: '/ai-avatar.png',
    },
    // Add more mock chats as needed
  ]);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r bg-background">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="space-y-1 p-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={cn(
                'w-full flex items-center space-x-3 p-3 rounded-lg transition-colors',
                selectedChatId === chat.id
                  ? 'bg-primary/10'
                  : 'hover:bg-muted'
              )}
            >
              <Avatar>
                <AvatarImage src={chat.avatar} alt={chat.name} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium truncate">{chat.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {chat.timestamp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 