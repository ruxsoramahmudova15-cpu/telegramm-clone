import React, { useState, useEffect } from 'react';
import { X, Eye, Clock, Image, CheckCheck, ChevronRight } from 'lucide-react';
import { settingsApi } from '../services/api';
import { UserSettings } from '../types';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type VisibilityOption = 'everyone' | 'contacts' | 'nobody';

const visibilityLabels: Record<VisibilityOption, string> = {
  everyone: 'Hamma',
  contacts: 'Kontaktlarim',
  nobody: 'Hech kim'
};

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    lastSeenVisibility: 'everyone',
    profilePhotoVisibility: 'everyone',
    onlineStatusVisibility: 'everyone',
    readReceipts: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get();
      if (response.success) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleVisibilityChange = async (field: string, value: VisibilityOption) => {
    setIsLoading(true);
    try {
      const response = await settingsApi.updatePrivacy({ [field]: value });
      if (response.success) {
        setSettings(prev => ({ ...prev, [field]: value }));
        setMessage({ type: 'success', text: 'Saqlandi!' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    } finally {
      setIsLoading(false);
      setActiveDropdown(null);
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    setIsLoading(true);
    try {
      const response = await settingsApi.updatePrivacy({ [field]: value });
      if (response.success) {
        setSettings(prev => ({ ...prev, [field]: value }));
        setMessage({ type: 'success', text: 'Saqlandi!' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <h3 className="text-white font-medium text-lg">Maxfiylik</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
            <X size={20} className="text-[#6c7883]" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-xl text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Last Seen */}
          <div className="bg-[#232e3c] rounded-xl overflow-hidden">
            <div 
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#2b3a4d] transition-colors"
              onClick={() => setActiveDropdown(activeDropdown === 'lastSeen' ? null : 'lastSeen')}
            >
              <Clock size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Oxirgi faollik</p>
                <p className="text-sm text-[#6c7883]">{visibilityLabels[settings.lastSeenVisibility || 'everyone']}</p>
              </div>
              <ChevronRight size={20} className={`text-[#6c7883] transition-transform ${activeDropdown === 'lastSeen' ? 'rotate-90' : ''}`} />
            </div>
            {activeDropdown === 'lastSeen' && (
              <div className="border-t border-[#0e1621]">
                {(['everyone', 'contacts', 'nobody'] as VisibilityOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => handleVisibilityChange('lastSeenVisibility', option)}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2b3a4d] transition-colors ${
                      settings.lastSeenVisibility === option ? 'text-[#5ca0d3]' : 'text-white'
                    }`}
                    disabled={isLoading}
                  >
                    {visibilityLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Photo */}
          <div className="bg-[#232e3c] rounded-xl overflow-hidden">
            <div 
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#2b3a4d] transition-colors"
              onClick={() => setActiveDropdown(activeDropdown === 'photo' ? null : 'photo')}
            >
              <Image size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Profil rasmi</p>
                <p className="text-sm text-[#6c7883]">{visibilityLabels[settings.profilePhotoVisibility || 'everyone']}</p>
              </div>
              <ChevronRight size={20} className={`text-[#6c7883] transition-transform ${activeDropdown === 'photo' ? 'rotate-90' : ''}`} />
            </div>
            {activeDropdown === 'photo' && (
              <div className="border-t border-[#0e1621]">
                {(['everyone', 'contacts', 'nobody'] as VisibilityOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => handleVisibilityChange('profilePhotoVisibility', option)}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2b3a4d] transition-colors ${
                      settings.profilePhotoVisibility === option ? 'text-[#5ca0d3]' : 'text-white'
                    }`}
                    disabled={isLoading}
                  >
                    {visibilityLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Online Status */}
          <div className="bg-[#232e3c] rounded-xl overflow-hidden">
            <div 
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#2b3a4d] transition-colors"
              onClick={() => setActiveDropdown(activeDropdown === 'online' ? null : 'online')}
            >
              <Eye size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Online holati</p>
                <p className="text-sm text-[#6c7883]">{visibilityLabels[settings.onlineStatusVisibility || 'everyone']}</p>
              </div>
              <ChevronRight size={20} className={`text-[#6c7883] transition-transform ${activeDropdown === 'online' ? 'rotate-90' : ''}`} />
            </div>
            {activeDropdown === 'online' && (
              <div className="border-t border-[#0e1621]">
                {(['everyone', 'contacts', 'nobody'] as VisibilityOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => handleVisibilityChange('onlineStatusVisibility', option)}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2b3a4d] transition-colors ${
                      settings.onlineStatusVisibility === option ? 'text-[#5ca0d3]' : 'text-white'
                    }`}
                    disabled={isLoading}
                  >
                    {visibilityLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Read Receipts */}
          <div className="bg-[#232e3c] rounded-xl">
            <div className="flex items-center gap-4 p-4">
              <CheckCheck size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">O'qilganlik belgisi</p>
                <p className="text-sm text-[#6c7883]">Xabar o'qilganini ko'rsatish</p>
              </div>
              <button
                onClick={() => handleToggle('readReceipts', !settings.readReceipts)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.readReceipts ? 'bg-[#5ca0d3]' : 'bg-[#6c7883]'
                }`}
                disabled={isLoading}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.readReceipts ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          <p className="text-[#6c7883] text-sm px-2">
            Agar siz oxirgi faollik vaqtingizni yashirsangiz, boshqalarning ham oxirgi faollik vaqtini ko'ra olmaysiz.
          </p>
        </div>
      </div>
    </div>
  );
};
