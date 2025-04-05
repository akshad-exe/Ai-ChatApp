'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function MessageInput({ onSendMessage, onSendFile, onSendImage }) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage('');
    setIsExpanded(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSendFile(file);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSendImage(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className={cn(
                'min-h-[40px] max-h-[120px] resize-none',
                isExpanded ? 'h-[120px]' : 'h-[40px]'
              )}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => {
                if (!message.trim()) {
                  setIsExpanded(false);
                }
              }}
            />
          </div>
          <Button type="button" variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" disabled={!message.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {isExpanded && (
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
            />
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              onChange={handleImageSelect}
              accept="image/*"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <File className="h-4 w-4 mr-2" />
              File
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </Button>
          </div>
        )}
      </div>
    </form>
  );
} 