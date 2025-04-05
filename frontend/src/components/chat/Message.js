'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';

export default function Message({ message, isOwnMessage }) {
  const {
    id,
    text,
    sender,
    timestamp,
    status,
    type = 'text',
    mediaUrl,
  } = message;

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (type) {
      case 'image':
        return (
          <img
            src={mediaUrl}
            alt="Shared image"
            className="max-w-full rounded-lg"
          />
        );
      case 'file':
        return (
          <div className="flex items-center space-x-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm">{text}</span>
          </div>
        );
      default:
        return <p className="text-sm">{text}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex items-start space-x-2',
        isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
      )}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback>{sender.name[0]}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-3',
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {!isOwnMessage && (
          <span className="text-xs font-medium mb-1 block">
            {sender.name}
          </span>
        )}
        {renderMessageContent()}
        <div className="flex items-center justify-end space-x-1 mt-1">
          <span className="text-xs opacity-70">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwnMessage && getStatusIcon()}
        </div>
      </div>
    </motion.div>
  );
} 