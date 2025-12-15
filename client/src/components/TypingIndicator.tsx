import React from 'react';
import { useSocket } from '../context/SocketContext';

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId?: string;
  showAnimation?: boolean;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  conversationId,
  currentUserId,
  showAnimation = true,
  className = ''
}) => {
  const { getTypingUsers } = useSocket();
  const typingUsers = getTypingUsers(conversationId).filter(t => t.userId !== currentUserId);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return typingUsers[0].username ? `${typingUsers[0].username} yozmoqda` : 'yozmoqda';
    }
    if (typingUsers.length === 2) {
      return `${typingUsers.length} kishi yozmoqda`;
    }
    return `${typingUsers.length} kishi yozmoqda`;
  };

  return (
    <div className={`flex items-center gap-2 text-telegram-blue text-sm ${className}`}>
      {showAnimation && <TypingDots />}
      <span>{getTypingText()}...</span>
    </div>
  );
};

// Animated typing dots
export const TypingDots: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="w-1.5 h-1.5 bg-telegram-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-telegram-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-telegram-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

// Typing bubble for chat
export const TypingBubble: React.FC<{ conversationId: string; currentUserId?: string }> = ({ 
  conversationId, 
  currentUserId 
}) => {
  const { getTypingUsers } = useSocket();
  const typingUsers = getTypingUsers(conversationId).filter(t => t.userId !== currentUserId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-telegram-bg-lighter px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-telegram-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-telegram-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-telegram-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
