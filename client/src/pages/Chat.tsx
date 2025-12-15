import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Search, Send, Menu, Users, Check, CheckCheck, 
  Smile, Paperclip, MoreVertical, Phone, ArrowLeft, Mic,
  Image, File, Clock, Video, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { SearchModal } from '../components/SearchModal';
import { OnlineIndicator, OnlineDot } from '../components/OnlineIndicator';
import { TypingBubble } from '../components/TypingIndicator';
import { StickerPicker } from '../components/StickerPicker';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { VideoRecorder } from '../components/VideoMessage';
import { ChatMenu } from '../components/ChatMenu';
import { ImageMessageBubble } from '../components/ImagePicker';
import { MediaPicker, VideoMessageBubble } from '../components/MediaPicker';
import { useChatBackground } from '../components/AppearanceSettings';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { GroupInfoModal } from '../components/GroupInfoModal';
import { FilePicker } from '../components/FilePicker';
import { Conversation, Message, User } from '../types';
import { userApi } from '../services/api';
import api from '../services/api';

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, activeConversation, messages, typingUsers, isLoading,
    setActiveConversation, sendMessage, sendMediaMessage, startTyping, stopTyping, createConversation, clearChat, refreshConversations
  } = useChat();
  const { emitTyping, requestUserStatus } = useSocket();
  const navigate = useNavigate();
  const chatBackground = useChatBackground();
  
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && activeConversation) {
      setShowSidebar(false);
    }
  }, [activeConversation, isMobile]);

  // Request user status when conversation is opened
  useEffect(() => {
    if (activeConversation?.type === 'direct') {
      const otherUserId = activeConversation.participants?.find(p => p !== user?.id);
      if (otherUserId) {
        requestUserStatus(otherUserId);
      }
    }
  }, [activeConversation, user?.id, requestUserStatus]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Search users
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const debounce = setTimeout(async () => {
      try {
        const response = await userApi.search(searchQuery);
        if (response.success) setSearchResults(response.users);
      } catch (error) { console.error('Search error:', error); }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
    stopTyping();
    if (activeConversation) emitTyping(activeConversation.id, false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    startTyping();
    if (activeConversation) emitTyping(activeConversation.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      if (activeConversation) emitTyping(activeConversation.id, false);
    }, 2000);
  };

  const handleStartChat = async (targetUser: User) => {
    const conversation = await createConversation('direct', [targetUser.id]);
    if (conversation) {
      setActiveConversation(conversation);
      setShowNewChat(false);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleStickerSelect = (sticker: string) => {
    sendMessage(sticker);
    setShowStickerPicker(false);
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.webm');
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        sendMessage(`🎤 Ovozli xabar (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`);
      }
    } catch (error) {
      console.error('Voice upload error:', error);
    }
    setIsRecordingVoice(false);
  };

  const handleVideoSend = async (videoBlob: Blob, duration: number) => {
    if (!activeConversation) return;
    try {
      const formData = new FormData();
      formData.append('file', videoBlob, 'video.webm');
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        sendMessage(`🎬 Video xabar (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`);
      }
    } catch (error) {
      console.error('Video upload error:', error);
    }
    setShowVideoRecorder(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSend(file);
    }
    setShowAttachMenu(false);
  };

  const handleFileSend = async (file: File) => {
    if (!activeConversation) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        const fileUrl = `http://localhost:5000/api/files/${res.data.file.id}/download`;
        // Format: FILE:url|name|size|mimeType
        const fileInfo = `FILE:${fileUrl}|${file.name}|${file.size}|${file.type}`;
        sendMessage(fileInfo, 'file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleMediaSend = (mediaUrl: string, fileName: string, type: 'image' | 'video') => {
    sendMediaMessage(mediaUrl, fileName, type);
    setShowMediaPicker(false);
    setShowAttachMenu(false);
  };

  const handleClearChat = () => {
    if (activeConversation && clearChat) {
      clearChat(activeConversation.id);
    }
  };

  const handleBlockUser = () => {
    setIsBlocked(!isBlocked);
    // TODO: Implement actual block functionality
  };

  const handleMuteChat = (muted: boolean) => {
    setIsMuted(muted);
    // TODO: Implement actual mute functionality
  };

  const handleGroupCreated = async (group: any) => {
    await refreshConversations();
    const newConv: Conversation = {
      id: group.id,
      type: 'group',
      name: group.name,
      description: group.description,
      picture: group.picture,
      participants: group.participants,
      admins: group.admins,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
    setActiveConversation(newConv);
    setShowCreateGroup(false);
  };

  const handleGroupUpdated = (group: any) => {
    if (activeConversation) {
      setActiveConversation({
        ...activeConversation,
        name: group.name,
        description: group.description,
        picture: group.picture
      });
    }
    refreshConversations();
  };

  const handleLeaveGroup = () => {
    setActiveConversation(null);
    setShowGroupInfo(false);
    refreshConversations();
  };

  const getTypingText = () => {
    const typing = typingUsers.filter(t => t.conversationId === activeConversation?.id && t.isTyping);
    return typing.length > 0 ? 'yozmoqda...' : null;
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Bugun';
    if (date.toDateString() === yesterday.toDateString()) return 'Kecha';
    return date.toLocaleDateString('uz', { day: 'numeric', month: 'long' });
  };

  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], msg) => {
    const dateStr = formatMessageDate(msg.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: dateStr, messages: [msg] });
    }
    return groups;
  }, []);

  return (
    <div className="h-screen bg-[#0e1621] flex overflow-hidden">
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectUser={handleStartChat}
        onSelectConversation={(conv) => { setActiveConversation(conv); setShowSearchModal(false); }}
        conversations={conversations}
      />

      {showVideoRecorder && (
        <VideoRecorder
          onSend={handleVideoSend}
          onCancel={() => setShowVideoRecorder(false)}
        />
      )}

      {showMediaPicker && (
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSend={handleMediaSend}
        />
      )}

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />

      {activeConversation?.type === 'group' && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversation={activeConversation}
          currentUserId={user?.id || ''}
          onGroupUpdated={handleGroupUpdated}
          onLeaveGroup={handleLeaveGroup}
        />
      )}

      <FilePicker
        isOpen={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSend={handleFileSend}
      />

      {/* Left Panel - Chat List */}
      <div className={`${showSidebar ? (isMobile ? 'w-full' : 'w-[420px] md:w-[320px] lg:w-[420px]') : 'w-0'} ${isMobile ? 'absolute inset-0 z-20' : ''} bg-[#17212b] flex flex-col transition-all duration-300 overflow-hidden border-r border-[#0e1621]`}>
        <div className="h-[56px] px-4 flex items-center gap-3 bg-[#17212b]">
          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full hover:bg-[#232e3c] flex items-center justify-center transition-colors">
            <Menu size={20} className="text-[#aaaaaa]" />
          </button>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7883]" />
            <input
              type="text"
              placeholder="Qidirish"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowNewChat(true); }}
              onClick={() => !showNewChat && setShowSearchModal(true)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#242f3d] text-white placeholder-[#6c7883] text-sm focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setShowCreateGroup(true)} 
            className="w-10 h-10 rounded-full hover:bg-[#232e3c] flex items-center justify-center transition-colors"
            title="Yangi guruh"
          >
            <Plus size={20} className="text-[#aaaaaa]" />
          </button>
        </div>

        {showNewChat && searchResults.length > 0 && (
          <div className="border-b border-[#0e1621]">
            {searchResults.map(u => (
              <button key={u.id} onClick={() => handleStartChat(u)}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#232e3c] transition-colors">
                <div className="relative">
                  <div className="w-[54px] h-[54px] rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center text-white font-medium text-lg overflow-hidden">
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      u.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <OnlineDot userId={u.id} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{u.displayName}</p>
                  <p className="text-[#6c7883] text-sm">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#6c7883]">
              <MessageCircle size={64} className="mb-4 opacity-30" />
              <p className="text-lg">Chatlar yo'q</p>
              <p className="text-sm mt-1">Yangi chat boshlang</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ChatListItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                currentUserId={user?.id || ''}
                onClick={() => setActiveConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Messages */}
      <div className={`flex-1 flex flex-col bg-[#0e1621] relative ${isMobile && showSidebar ? 'hidden' : ''}`}>
        {activeConversation ? (
          <>
            <div className="h-[56px] px-4 flex items-center justify-between bg-[#17212b] border-b border-[#0e1621]">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowSidebar(true); if (isMobile) setActiveConversation(null); }} className="md:hidden p-2 rounded-full hover:bg-[#232e3c]">
                  <ArrowLeft size={20} className="text-[#aaaaaa]" />
                </button>
                <div 
                  className="relative cursor-pointer"
                  onClick={() => activeConversation.type === 'group' && setShowGroupInfo(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center text-white font-medium overflow-hidden">
                    {activeConversation.type === 'group' ? (
                      activeConversation.picture ? (
                        <img src={activeConversation.picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={18} />
                      )
                    ) : activeConversation.picture ? (
                      <img src={activeConversation.picture} alt="" className="w-full h-full object-cover" />
                    ) : activeConversation.name?.charAt(0).toUpperCase()}
                  </div>
                  {activeConversation.type === 'direct' && (
                    <OnlineDot userId={activeConversation.participants?.find(p => p !== user?.id) || ''} className="border-[#17212b]" />
                  )}
                </div>
                <div 
                  className={activeConversation.type === 'group' ? 'cursor-pointer' : ''}
                  onClick={() => activeConversation.type === 'group' && setShowGroupInfo(true)}
                >
                  <p className="text-white font-medium text-[15px]">{activeConversation.name || 'Chat'}</p>
                  <div className="text-[13px]">
                    {getTypingText() ? (
                      <span className="text-[#5ca0d3]">yozmoqda...</span>
                    ) : activeConversation.type === 'group' ? (
                      <span className="text-[#6c7883]">{activeConversation.participants?.length || 0} a'zo</span>
                    ) : (
                      <OnlineIndicator userId={activeConversation.participants?.find(p => p !== user?.id) || ''} showText showDot={false} />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-10 h-10 rounded-full hover:bg-[#232e3c] flex items-center justify-center transition-colors">
                  <Phone size={20} className="text-[#aaaaaa]" />
                </button>
                <button className="w-10 h-10 rounded-full hover:bg-[#232e3c] flex items-center justify-center transition-colors">
                  <Search size={20} className="text-[#aaaaaa]" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowChatMenu(!showChatMenu)}
                    className="w-10 h-10 rounded-full hover:bg-[#232e3c] flex items-center justify-center transition-colors"
                  >
                    <MoreVertical size={20} className="text-[#aaaaaa]" />
                  </button>
                  <ChatMenu
                    isOpen={showChatMenu}
                    onClose={() => setShowChatMenu(false)}
                    conversationId={activeConversation.id}
                    conversationName={activeConversation.name || 'Chat'}
                    onClearChat={handleClearChat}
                    onBlockUser={handleBlockUser}
                    onMuteChat={handleMuteChat}
                    isMuted={isMuted}
                    isBlocked={isBlocked}
                  />
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar"
              style={{ backgroundImage: chatBackground, backgroundColor: '#0e1621' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-3 border-[#5ca0d3] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-24 h-24 rounded-full bg-[#17212b] flex items-center justify-center mb-4">
                    <MessageCircle size={40} className="text-[#5ca0d3]" />
                  </div>
                  <p className="text-[#6c7883] text-center">Hozircha xabarlar yo'q<br/>Birinchi xabarni yuboring!</p>
                </div>
              ) : (
                <div className="max-w-[800px] mx-auto">
                  {groupedMessages.map((group, idx) => (
                    <div key={idx}>
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 rounded-full bg-[#182533]/80 text-[#6c7883] text-xs">{group.date}</span>
                      </div>
                      {group.messages.map((msg, msgIdx) => {
                        const isOwn = msg.senderId === user?.id || msg.sender?.id === user?.id;
                        return (
                          <MessageBubble key={msg.id} message={msg} isOwn={isOwn}
                            showTail={msgIdx === group.messages.length - 1 || group.messages[msgIdx + 1]?.senderId !== msg.senderId} />
                        );
                      })}
                    </div>
                  ))}
                  <TypingBubble conversationId={activeConversation.id} currentUserId={user?.id} />
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 bg-[#17212b]">
              <form onSubmit={handleSendMessage} className="max-w-[800px] mx-auto">
                <div className="flex items-end gap-2 bg-[#242f3d] rounded-xl px-3 py-2">
                  {/* Sticker Button */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowStickerPicker(!showStickerPicker)}
                      className="p-2 rounded-full hover:bg-[#17212b] transition-colors"
                    >
                      <Smile size={24} className="text-[#6c7883]" />
                    </button>
                    <StickerPicker
                      isOpen={showStickerPicker}
                      onClose={() => setShowStickerPicker(false)}
                      onSelect={handleStickerSelect}
                    />
                  </div>

                  {/* Attach Button */}
                  <div className="relative">
                    <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} 
                      className="p-2 rounded-full hover:bg-[#17212b] transition-colors">
                      <Paperclip size={24} className="text-[#6c7883]" />
                    </button>
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-[#17212b] rounded-xl shadow-xl py-2 min-w-[180px] z-50">
                        <button
                          type="button"
                          onClick={() => { setShowMediaPicker(true); setShowAttachMenu(false); }}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#232e3c] text-white text-sm"
                        >
                          <Image size={20} className="text-[#5ca0d3]" />Rasm / Video
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowFilePicker(true); setShowAttachMenu(false); }}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#232e3c] text-white text-sm"
                        >
                          <File size={20} className="text-[#5ca0d3]" />Fayl
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setShowVideoRecorder(true); setShowAttachMenu(false); }}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#232e3c] text-white text-sm"
                        >
                          <Video size={20} className="text-[#5ca0d3]" />Aylana video
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input or Voice Recorder */}
                  {isRecordingVoice ? (
                    <VoiceRecorder
                      onSend={handleVoiceSend}
                      onCancel={() => setIsRecordingVoice(false)}
                    />
                  ) : (
                    <>
                      <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder="Xabar yozing..."
                        className="flex-1 bg-transparent text-white placeholder-[#6c7883] py-2 focus:outline-none text-[15px]"
                      />
                      {messageInput.trim() ? (
                        <button type="submit" className="p-2 rounded-full bg-[#5ca0d3] hover:bg-[#4a8fc2] transition-colors">
                          <Send size={20} className="text-white" />
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => setIsRecordingVoice(true)}
                          className="p-2 rounded-full hover:bg-[#17212b] transition-colors"
                        >
                          <Mic size={24} className="text-[#6c7883]" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ backgroundImage: chatBackground, backgroundColor: '#0e1621' }}>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-[#17212b] flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={56} className="text-[#5ca0d3]" />
              </div>
              <h2 className="text-2xl font-medium text-white mb-2">Telegram Web</h2>
              <p className="text-[#6c7883] max-w-sm">Suhbatni boshlash uchun chatni tanlang yoki yangi chat yarating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// Chat List Item
const ChatListItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}> = ({ conversation, isActive, currentUserId, onClick }) => {
  const otherUserId = conversation.type === 'direct' 
    ? conversation.participants?.find(p => p !== currentUserId) 
    : null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Kecha';
    if (days < 7) return date.toLocaleDateString('uz', { weekday: 'short' });
    return date.toLocaleDateString('uz', { day: '2-digit', month: '2-digit' });
  };

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 flex items-center gap-3 transition-colors ${
        isActive ? 'bg-[#2b5278]' : 'hover:bg-[#232e3c]'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-[54px] h-[54px] rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center text-white font-medium text-lg overflow-hidden">
          {conversation.type === 'group' ? (
            <Users size={22} />
          ) : conversation.picture ? (
            <img src={conversation.picture} alt="" className="w-full h-full object-cover" />
          ) : (
            conversation.name?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        {otherUserId && <OnlineDot userId={otherUserId} className="border-[#17212b]" />}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-white font-medium text-[15px] truncate">{conversation.name || 'Chat'}</p>
          {conversation.lastMessage && (
            <span className={`text-xs flex-shrink-0 ml-2 ${isActive ? 'text-white/70' : 'text-[#6c7883]'}`}>
              {formatTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${isActive ? 'text-white/70' : 'text-[#6c7883]'}`}>
            {conversation.lastMessage?.content || 'Xabarlar yo\'q'}
          </p>
          {(conversation.unreadCount || 0) > 0 && (
            <span className="ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium bg-[#5ca0d3] text-white rounded-full">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// Message Status Icon
const MessageStatusIcon: React.FC<{ status?: string; isOwn: boolean }> = ({ status, isOwn }) => {
  if (!isOwn) return null;
  switch (status) {
    case 'sending': return <Clock size={14} className="text-white/40" />;
    case 'sent': return <Check size={14} className="text-white/50" />;
    case 'delivered': return <CheckCheck size={14} className="text-white/50" />;
    case 'seen': return <CheckCheck size={14} className="text-[#5ca0d3]" />;
    default: return <Check size={14} className="text-white/50" />;
  }
};

// Message Bubble
const MessageBubble: React.FC<{
  message: Message;
  isOwn: boolean;
  showTail?: boolean;
}> = ({ message, isOwn, showTail = true }) => {
  const time = new Date(message.createdAt).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  
  // Get message type (backend sends 'type', frontend uses 'messageType')
  const msgType = message.messageType || (message as any).type || 'text';
  
  // Check if it's a media file from our server
  const isServerMedia = message.content.includes('/api/files/') && message.content.includes('/download');
  
  // Check if message is an image
  const isImage = msgType === 'image' || 
    (message.content.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.content)) ||
    (isServerMedia && msgType === 'image');
  
  // Check if message is a video
  const isVideo = msgType === 'video' || 
    (message.content.startsWith('http') && /\.(mp4|webm|mov|avi)$/i.test(message.content)) ||
    (isServerMedia && msgType === 'video');

  // Check if message is a file
  const isFile = msgType === 'file' || 
    message.content.startsWith('FILE:') || 
    message.content.startsWith('📎 Fayl:');

  // Lazy import FileMessageBubble to avoid circular dependency
  const FileMessageBubble = React.lazy(() => import('../components/FileMessageBubble').then(m => ({ default: m.FileMessageBubble })));

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${showTail ? 'mb-2' : ''}`}>
        {!isOwn && message.sender && (
          <p className="text-[13px] text-[#5ca0d3] mb-1 font-medium">{message.sender.displayName}</p>
        )}
        
        {isImage ? (
          <ImageMessageBubble
            imageUrl={message.content}
            isOwn={isOwn}
            time={time}
            status={message.status}
          />
        ) : isVideo ? (
          <VideoMessageBubble
            videoUrl={message.content}
            isOwn={isOwn}
            time={time}
            status={message.status}
          />
        ) : isFile ? (
          <React.Suspense fallback={<div className="p-3 bg-[#182533] rounded-xl">Yuklanmoqda...</div>}>
            <FileMessageBubble
              content={message.content}
              isOwn={isOwn}
              time={time}
              status={message.status}
            />
          </React.Suspense>
        ) : (
          <div className={`relative px-3 py-1.5 ${
            isOwn ? 'bg-[#2b5278] text-white' : 'bg-[#182533] text-white'
          } ${showTail ? isOwn ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`}>
            <p className="text-[15px] leading-[1.3125] break-words pr-14">{message.content}</p>
            <span className={`absolute bottom-1.5 right-2 flex items-center gap-1 text-[11px] ${
              isOwn ? 'text-white/50' : 'text-[#6c7883]'
            }`}>
              {time}
              <MessageStatusIcon status={message.status} isOwn={isOwn} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
