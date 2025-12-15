import React, { useState } from 'react';
import { Trash2, Ban, VolumeX, Volume2, Pin, Bell, BellOff, Archive, X } from 'lucide-react';

interface ChatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  onClearChat: () => void;
  onBlockUser: () => void;
  onMuteChat: (muted: boolean) => void;
  isMuted?: boolean;
  isBlocked?: boolean;
}

export const ChatMenu: React.FC<ChatMenuProps> = ({
  isOpen,
  onClose,
  conversationName,
  onClearChat,
  onBlockUser,
  onMuteChat,
  isMuted = false,
  isBlocked = false
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  if (!isOpen) return null;

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    onClearChat();
    setShowClearConfirm(false);
    onClose();
  };

  const handleBlockUser = () => {
    setShowBlockConfirm(true);
  };

  const confirmBlockUser = () => {
    onBlockUser();
    setShowBlockConfirm(false);
    onClose();
  };

  const handleMuteToggle = () => {
    onMuteChat(!isMuted);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div className="absolute top-full right-0 mt-2 w-[220px] bg-[#17212b] rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
        {/* Mute */}
        <button
          onClick={handleMuteToggle}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#232e3c] transition-colors"
        >
          {isMuted ? (
            <>
              <Bell size={20} className="text-[#6c7883]" />
              <span className="text-white text-sm">Ovozni yoqish</span>
            </>
          ) : (
            <>
              <BellOff size={20} className="text-[#6c7883]" />
              <span className="text-white text-sm">Ovozni o'chirish</span>
            </>
          )}
        </button>

        {/* Pin */}
        <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#232e3c] transition-colors">
          <Pin size={20} className="text-[#6c7883]" />
          <span className="text-white text-sm">Chatni biriktirish</span>
        </button>

        {/* Archive */}
        <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#232e3c] transition-colors">
          <Archive size={20} className="text-[#6c7883]" />
          <span className="text-white text-sm">Arxivlash</span>
        </button>

        <div className="h-px bg-[#0e1621] my-1" />

        {/* Clear chat */}
        <button
          onClick={handleClearChat}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#232e3c] transition-colors"
        >
          <Trash2 size={20} className="text-red-400" />
          <span className="text-red-400 text-sm">Chatni tozalash</span>
        </button>

        {/* Block user */}
        <button
          onClick={handleBlockUser}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#232e3c] transition-colors"
        >
          <Ban size={20} className="text-red-400" />
          <span className="text-red-400 text-sm">
            {isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
          </span>
        </button>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#17212b] rounded-xl p-5 sm:p-6 w-full max-w-[320px] shadow-2xl">
            <h3 className="text-white text-lg font-medium mb-2">Chatni tozalash</h3>
            <p className="text-[#6c7883] text-sm mb-6">
              "{conversationName}" bilan barcha xabarlarni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#232e3c] text-white hover:bg-[#2b3a4d] transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmClearChat}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#17212b] rounded-xl p-5 sm:p-6 w-full max-w-[320px] shadow-2xl">
            <h3 className="text-white text-lg font-medium mb-2">
              {isBlocked ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
            </h3>
            <p className="text-[#6c7883] text-sm mb-6">
              {isBlocked 
                ? `"${conversationName}" ni blokdan chiqarmoqchimisiz?`
                : `"${conversationName}" ni bloklaysizmi? U sizga xabar yubora olmaydi.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#232e3c] text-white hover:bg-[#2b3a4d] transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmBlockUser}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
