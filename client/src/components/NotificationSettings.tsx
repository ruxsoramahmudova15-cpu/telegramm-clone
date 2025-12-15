import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Users, Volume2, Eye } from 'lucide-react';
import { settingsApi } from '../services/api';
import { UserSettings } from '../types';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    messageNotifications: true,
    groupNotifications: true,
    notificationSound: true,
    notificationPreview: true
  });
  const [isLoading, setIsLoading] = useState(false);
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

  const handleToggle = async (field: keyof UserSettings, value: boolean) => {
    setIsLoading(true);
    try {
      const response = await settingsApi.updateNotifications({ [field]: value });
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

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#5ca0d3]' : 'bg-[#6c7883]'}`}
      disabled={isLoading}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <h3 className="text-white font-medium text-lg">Bildirishnomalar</h3>
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
          {/* Message Notifications */}
          <div className="bg-[#232e3c] rounded-xl">
            <div className="flex items-center gap-4 p-4">
              <MessageSquare size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Xabar bildirishnomalari</p>
                <p className="text-sm text-[#6c7883]">Yangi xabarlar haqida xabar berish</p>
              </div>
              <ToggleSwitch 
                enabled={settings.messageNotifications || false}
                onChange={() => handleToggle('messageNotifications', !settings.messageNotifications)}
              />
            </div>
          </div>

          {/* Group Notifications */}
          <div className="bg-[#232e3c] rounded-xl">
            <div className="flex items-center gap-4 p-4">
              <Users size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Guruh bildirishnomalari</p>
                <p className="text-sm text-[#6c7883]">Guruh xabarlari haqida xabar berish</p>
              </div>
              <ToggleSwitch 
                enabled={settings.groupNotifications || false}
                onChange={() => handleToggle('groupNotifications', !settings.groupNotifications)}
              />
            </div>
          </div>

          {/* Notification Sound */}
          <div className="bg-[#232e3c] rounded-xl">
            <div className="flex items-center gap-4 p-4">
              <Volume2 size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Ovozli bildirishnoma</p>
                <p className="text-sm text-[#6c7883]">Bildirishnoma kelganda ovoz chiqarish</p>
              </div>
              <ToggleSwitch 
                enabled={settings.notificationSound || false}
                onChange={() => handleToggle('notificationSound', !settings.notificationSound)}
              />
            </div>
          </div>

          {/* Notification Preview */}
          <div className="bg-[#232e3c] rounded-xl">
            <div className="flex items-center gap-4 p-4">
              <Eye size={20} className="text-[#5ca0d3]" />
              <div className="flex-1">
                <p className="text-white">Xabar ko'rinishi</p>
                <p className="text-sm text-[#6c7883]">Bildirishnomada xabar matnini ko'rsatish</p>
              </div>
              <ToggleSwitch 
                enabled={settings.notificationPreview || false}
                onChange={() => handleToggle('notificationPreview', !settings.notificationPreview)}
              />
            </div>
          </div>

          <p className="text-[#6c7883] text-sm px-2">
            Bildirishnomalar brauzer sozlamalarida ham yoqilgan bo'lishi kerak.
          </p>
        </div>
      </div>
    </div>
  );
};
