import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageCircle, User as UserIcon, Users } from 'lucide-react';
import { User, Conversation } from '../types';
import { userApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { OnlineDot } from './OnlineIndicator';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  onSelectConversation: (conversation: Conversation) => void;
  conversations: Conversation[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  onSelectConversation,
  conversations
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUserOnline } = useSocket();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setUsers([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2) {
        setUsers([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await userApi.search(query);
        if (response.success) setUsers(response.users);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Filter conversations by query
  const filteredConversations = conversations.filter(c => 
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20 px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-telegram-bg-light rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-telegram-bg-lighter">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-telegram-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Foydalanuvchi yoki chat qidirish..."
              className="w-full pl-12 pr-12 py-3 rounded-xl bg-telegram-bg text-telegram-text placeholder-telegram-text-secondary focus:outline-none focus:ring-2 focus:ring-telegram-blue/50"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-telegram-bg-lighter"
            >
              <X size={20} className="text-telegram-text-secondary" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-96">
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-telegram-blue mx-auto" />
            </div>
          )}

          {/* Conversations */}
          {filteredConversations.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-telegram-text-secondary uppercase tracking-wider bg-telegram-bg">
                Chatlar
              </div>
              {filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { onSelectConversation(conv); onClose(); }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-telegram-bg-lighter transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-telegram-blue to-telegram-blue-light flex items-center justify-center text-white">
                    {conv.type === 'group' ? <Users size={20} /> : <MessageCircle size={20} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-telegram-text">{conv.name || 'Chat'}</p>
                    <p className="text-sm text-telegram-text-secondary">
                      {conv.type === 'group' ? `${conv.participants?.length || 0} a'zo` : 'Shaxsiy chat'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {users.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-telegram-text-secondary uppercase tracking-wider bg-telegram-bg">
                Foydalanuvchilar
              </div>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { onSelectUser(u); onClose(); }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-telegram-bg-lighter transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <OnlineDot userId={u.id} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-telegram-text">{u.displayName}</p>
                    <p className="text-sm text-telegram-text-secondary">@{u.username}</p>
                  </div>
                  {(u.isOnline || isUserOnline(u.id)) && (
                    <span className="text-xs text-telegram-success">online</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && query.length >= 2 && users.length === 0 && filteredConversations.length === 0 && (
            <div className="p-8 text-center text-telegram-text-secondary">
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>Hech narsa topilmadi</p>
            </div>
          )}

          {/* Initial State */}
          {query.length < 2 && (
            <div className="p-8 text-center text-telegram-text-secondary">
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>Qidirish uchun kamida 2 ta belgi kiriting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
