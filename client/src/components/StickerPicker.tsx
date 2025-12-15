import React, { useState } from 'react';
import { X } from 'lucide-react';

// Telegram style stickers (emoji-based for simplicity)
const STICKER_PACKS = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕'],
  gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '💪', '🦾', '🖕', '✍️', '🤳', '💅'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '😻', '🥰', '😍', '🤩', '😘'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'],
  objects: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
};

type StickerCategory = keyof typeof STICKER_PACKS;

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sticker: string) => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('smileys');

  if (!isOpen) return null;

  const categories: { key: StickerCategory; emoji: string; label: string }[] = [
    { key: 'smileys', emoji: '😀', label: 'Smileys' },
    { key: 'gestures', emoji: '👍', label: 'Gestures' },
    { key: 'hearts', emoji: '❤️', label: 'Hearts' },
    { key: 'animals', emoji: '🐶', label: 'Animals' },
    { key: 'food', emoji: '🍎', label: 'Food' },
    { key: 'objects', emoji: '⚽', label: 'Objects' },
  ];

  return (
    <div className="absolute bottom-full left-0 mb-2 w-[280px] sm:w-[320px] bg-[#17212b] rounded-xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#0e1621]">
        <span className="text-white text-sm font-medium">Stikerlar</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-[#232e3c] transition-colors">
          <X size={16} className="text-[#6c7883]" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex border-b border-[#0e1621]">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-1 py-2 text-xl hover:bg-[#232e3c] transition-colors ${
              activeCategory === cat.key ? 'bg-[#232e3c]' : ''
            }`}
            title={cat.label}
          >
            {cat.emoji}
          </button>
        ))}
      </div>

      {/* Stickers Grid */}
      <div className="h-[180px] sm:h-[200px] overflow-y-auto custom-scrollbar p-2">
        <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
          {STICKER_PACKS[activeCategory].map((sticker, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelect(sticker);
                onClose();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl hover:bg-[#232e3c] rounded-lg transition-colors"
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
