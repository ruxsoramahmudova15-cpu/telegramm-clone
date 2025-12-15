import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

// Chat background options
const CHAT_BACKGROUNDS = [
  { id: 'default', name: 'Standart', type: 'pattern', value: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23182533" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { id: 'dark', name: 'Qora', type: 'color', value: '#0e1621' },
  { id: 'blue', name: 'Ko\'k', type: 'gradient', value: 'linear-gradient(135deg, #1a2a3a 0%, #0e1621 100%)' },
  { id: 'purple', name: 'Binafsha', type: 'gradient', value: 'linear-gradient(135deg, #2d1f3d 0%, #1a1625 100%)' },
  { id: 'green', name: 'Yashil', type: 'gradient', value: 'linear-gradient(135deg, #1a2f2a 0%, #0e1a17 100%)' },
  { id: 'stars', name: 'Yulduzlar', type: 'pattern', value: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="10" cy="10" r="1"/%3E%3Ccircle cx="30" cy="50" r="1.5"/%3E%3Ccircle cx="70" cy="20" r="1"/%3E%3Ccircle cx="90" cy="80" r="1.5"/%3E%3Ccircle cx="50" cy="90" r="1"/%3E%3Ccircle cx="20" cy="70" r="0.5"/%3E%3Ccircle cx="80" cy="40" r="0.5"/%3E%3Ccircle cx="60" cy="60" r="1"/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #0e1621 0%, #1a2533 100%)' },
  { id: 'dots', name: 'Nuqtalar', type: 'pattern', value: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="3" cy="3" r="1"/%3E%3Ccircle cx="13" cy="13" r="1"/%3E%3C/g%3E%3C/svg%3E"), #0e1621' },
  { id: 'waves', name: 'To\'lqinlar', type: 'pattern', value: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="18" viewBox="0 0 100 18"%3E%3Cpath fill="%23182533" fill-opacity="0.3" d="M0 18c25 0 25-18 50-18s25 18 50 18v-18H0z"/%3E%3C/svg%3E"), #0e1621' },
];

// Theme colors
const THEME_COLORS = [
  { id: 'blue', name: 'Ko\'k', primary: '#5ca0d3', secondary: '#2b5278' },
  { id: 'purple', name: 'Binafsha', primary: '#8774e1', secondary: '#5c4d99' },
  { id: 'green', name: 'Yashil', primary: '#4fae4e', secondary: '#3d8c3c' },
  { id: 'orange', name: 'To\'q sariq', primary: '#e8a445', secondary: '#b88235' },
  { id: 'pink', name: 'Pushti', primary: '#e05d91', secondary: '#b34a74' },
  { id: 'cyan', name: 'Zangori', primary: '#45c7e8', secondary: '#359eb8' },
];

interface AppearanceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ isOpen, onClose }) => {
  const [selectedBackground, setSelectedBackground] = useState(() => {
    return localStorage.getItem('chatBackground') || 'default';
  });
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('themeColor') || 'blue';
  });

  useEffect(() => {
    // Apply background
    const bg = CHAT_BACKGROUNDS.find(b => b.id === selectedBackground);
    if (bg) {
      localStorage.setItem('chatBackground', selectedBackground);
      localStorage.setItem('chatBackgroundValue', bg.value);
      // Dispatch event for Chat component to update
      window.dispatchEvent(new CustomEvent('backgroundChange', { detail: bg.value }));
    }
  }, [selectedBackground]);

  useEffect(() => {
    // Apply theme color
    const theme = THEME_COLORS.find(t => t.id === selectedTheme);
    if (theme) {
      localStorage.setItem('themeColor', selectedTheme);
      document.documentElement.style.setProperty('--color-primary', theme.primary);
      document.documentElement.style.setProperty('--color-secondary', theme.secondary);
    }
  }, [selectedTheme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0e1621] z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#17212b] border-b border-[#0e1621] z-10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#232e3c] transition-colors">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Ko'rinish</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Chat Background */}
        <div>
          <h2 className="text-white font-medium mb-4">Chat foni</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {CHAT_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedBackground === bg.id ? 'border-[#5ca0d3] scale-105' : 'border-transparent'
                }`}
              >
                <div 
                  className="w-full h-full"
                  style={{ 
                    background: bg.type === 'color' ? bg.value : undefined,
                    backgroundImage: bg.type !== 'color' ? bg.value : undefined,
                    backgroundColor: bg.type === 'pattern' ? '#0e1621' : undefined
                  }}
                />
                {selectedBackground === bg.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-6 h-6 rounded-full bg-[#5ca0d3] flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white text-center bg-black/50 rounded px-1">
                  {bg.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Color */}
        <div>
          <h2 className="text-white font-medium mb-4">Rang sxemasi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {THEME_COLORS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedTheme === theme.id ? 'border-[#5ca0d3]' : 'border-[#232e3c]'
                } bg-[#17212b]`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span className="text-white text-sm">{theme.name}</span>
                </div>
                {selectedTheme === theme.id && (
                  <div className="absolute top-2 right-2">
                    <Check size={16} className="text-[#5ca0d3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-white font-medium mb-4">Ko'rinish</h2>
          <div 
            className="rounded-xl overflow-hidden h-[250px] sm:h-[300px] p-3 sm:p-4"
            style={{ 
              backgroundImage: CHAT_BACKGROUNDS.find(b => b.id === selectedBackground)?.value,
              backgroundColor: '#0e1621'
            }}
          >
            {/* Sample messages */}
            <div className="space-y-2 max-w-[300px] mx-auto">
              <div className="flex justify-start">
                <div className="bg-[#182533] text-white px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                  <p className="text-sm">Salom! Qalaysiz?</p>
                  <span className="text-[10px] text-[#6c7883]">12:00</span>
                </div>
              </div>
              <div className="flex justify-end">
                <div 
                  className="text-white px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]"
                  style={{ backgroundColor: THEME_COLORS.find(t => t.id === selectedTheme)?.secondary }}
                >
                  <p className="text-sm">Yaxshi, rahmat! Sizchi?</p>
                  <span className="text-[10px] text-white/50">12:01</span>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-[#182533] text-white px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                  <p className="text-sm">Zo'r! Yangi loyiha ustida ishlayman 🚀</p>
                  <span className="text-[10px] text-[#6c7883]">12:02</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to get current chat background
export const useChatBackground = () => {
  const [background, setBackground] = useState(() => {
    return localStorage.getItem('chatBackgroundValue') || CHAT_BACKGROUNDS[0].value;
  });

  useEffect(() => {
    const handleChange = (e: CustomEvent) => {
      setBackground(e.detail);
    };

    window.addEventListener('backgroundChange', handleChange as EventListener);
    return () => window.removeEventListener('backgroundChange', handleChange as EventListener);
  }, []);

  return background;
};
