import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Edit2, Phone, AtSign, Info, Check, X, LogOut, Bell, Lock, Palette, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import api from '../services/api';
import { AppearanceSettings } from '../components/AppearanceSettings';
import { PrivacySettings } from '../components/PrivacySettings';
import { NotificationSettings } from '../components/NotificationSettings';

type EditingField = 'displayName' | 'username' | 'bio' | null;

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Rasm hajmi 5MB dan oshmasligi kerak' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      
      // Upload image
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          // API server URL - localhost:5000
          const pictureUrl = `http://localhost:5000/api/files/${uploadRes.data.file.id}/download`;
          const updateRes = await userApi.updateProfile({ profilePicture: pictureUrl });
          if (updateRes.success) {
            setProfilePicture(pictureUrl);
            updateUser({ profilePicture: pictureUrl });
            setMessage({ type: 'success', text: 'Rasm yangilandi!' });
            setTimeout(() => setMessage(null), 2000);
          }
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Rasm yuklashda xatolik' });
      } finally {
        setIsLoading(false);
        setPreviewUrl(null);
      }
    }
  };

  const handleSaveField = async (field: EditingField) => {
    if (!field) return;
    setIsLoading(true);
    setMessage(null);
    
    try {
      const updateData: any = {};
      if (field === 'displayName') updateData.displayName = displayName.trim();
      if (field === 'username') updateData.username = username.trim();
      if (field === 'bio') updateData.bio = bio.trim();

      const response = await userApi.updateProfile(updateData);
      if (response.success) {
        setEditingField(null);
        updateUser(updateData);
        setMessage({ type: 'success', text: 'Muvaffaqiyatli saqlandi!' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Xatolik yuz berdi' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = (field: EditingField) => {
    if (field === 'displayName') setDisplayName(user?.displayName || '');
    if (field === 'username') setUsername(user?.username || '');
    if (field === 'bio') setBio(user?.bio || '');
    setEditingField(null);
  };

  const getAvatarContent = () => {
    if (previewUrl) return <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />;
    if (profilePicture) return <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />;
    return <span className="text-4xl font-bold text-white">{user?.displayName?.charAt(0).toUpperCase()}</span>;
  };

  return (
    <div className="min-h-screen bg-telegram-bg pb-20">
      {/* Header */}
      <div className="bg-telegram-bg-light border-b border-telegram-bg-lighter sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4 p-4">
          <button onClick={() => navigate('/chat')} className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors">
            <ArrowLeft size={24} className="text-telegram-text" />
          </button>
          <h1 className="text-xl font-bold text-telegram-text">Profil</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Message */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Profile Picture */}
        <div className="flex flex-col items-center py-8">
        <div className="relative">
          <div 
            onClick={handleImageClick}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-telegram-blue to-blue-400 flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
          >
            {getAvatarContent()}
          </div>
          <button 
            onClick={handleImageClick}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-telegram-blue flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors"
          >
            <Camera size={20} className="text-white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <p className="mt-3 text-telegram-text-secondary">@{user?.username}</p>
      </div>

      {/* Editable Fields */}
      <div className="px-4 space-y-3">
        {/* Display Name */}
        <div className="bg-telegram-bg-light rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Info size={20} className="text-telegram-text-secondary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editingField === 'displayName' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-telegram-bg text-telegram-text p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                    placeholder="Ismingizni kiriting"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleCancelEdit('displayName')} className="p-2 rounded-lg bg-telegram-bg hover:bg-telegram-bg-lighter" disabled={isLoading}>
                      <X size={18} className="text-red-400" />
                    </button>
                    <button onClick={() => handleSaveField('displayName')} className="p-2 rounded-lg bg-telegram-blue hover:bg-blue-500" disabled={isLoading}>
                      {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={18} className="text-white" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-telegram-text font-medium">{displayName || 'Ism kiriting'}</p>
                    <p className="text-sm text-telegram-text-secondary">Ism</p>
                  </div>
                  <button onClick={() => setEditingField('displayName')} className="p-2 rounded-lg hover:bg-telegram-bg transition-colors">
                    <Edit2 size={18} className="text-telegram-blue" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="bg-telegram-bg-light rounded-xl p-4">
          <div className="flex items-center gap-4">
            <AtSign size={20} className="text-telegram-text-secondary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editingField === 'username' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-telegram-bg text-telegram-text p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                    placeholder="Username kiriting"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleCancelEdit('username')} className="p-2 rounded-lg bg-telegram-bg hover:bg-telegram-bg-lighter" disabled={isLoading}>
                      <X size={18} className="text-red-400" />
                    </button>
                    <button onClick={() => handleSaveField('username')} className="p-2 rounded-lg bg-telegram-blue hover:bg-blue-500" disabled={isLoading}>
                      {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={18} className="text-white" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-telegram-text font-medium">@{username}</p>
                    <p className="text-sm text-telegram-text-secondary">Username</p>
                  </div>
                  <button onClick={() => setEditingField('username')} className="p-2 rounded-lg hover:bg-telegram-bg transition-colors">
                    <Edit2 size={18} className="text-telegram-blue" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-telegram-bg-light rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Phone size={20} className="text-telegram-text-secondary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-telegram-text font-medium">{user?.phone}</p>
              <p className="text-sm text-telegram-text-secondary">Telefon raqam</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-telegram-bg-light rounded-xl p-4">
          <div className="flex items-start gap-4">
            <Info size={20} className="text-telegram-text-secondary flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              {editingField === 'bio' ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-telegram-bg text-telegram-text p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue resize-none"
                    placeholder="O'zingiz haqingizda yozing..."
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleCancelEdit('bio')} className="p-2 rounded-lg bg-telegram-bg hover:bg-telegram-bg-lighter" disabled={isLoading}>
                      <X size={18} className="text-red-400" />
                    </button>
                    <button onClick={() => handleSaveField('bio')} className="p-2 rounded-lg bg-telegram-blue hover:bg-blue-500" disabled={isLoading}>
                      {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={18} className="text-white" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-telegram-text font-medium">{bio || "Bio qo'shilmagan"}</p>
                    <p className="text-sm text-telegram-text-secondary">Bio</p>
                  </div>
                  <button onClick={() => setEditingField('bio')} className="p-2 rounded-lg hover:bg-telegram-bg transition-colors">
                    <Edit2 size={18} className="text-telegram-blue" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="px-4 mt-6">
        <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
          <button 
            onClick={() => setShowNotifications(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-telegram-bg-lighter transition-colors border-b border-telegram-bg"
          >
            <Bell size={20} className="text-telegram-text-secondary" />
            <span className="flex-1 text-left text-telegram-text">Bildirishnomalar</span>
            <ChevronRight size={20} className="text-telegram-text-secondary" />
          </button>
          <button 
            onClick={() => setShowPrivacy(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-telegram-bg-lighter transition-colors border-b border-telegram-bg"
          >
            <Lock size={20} className="text-telegram-text-secondary" />
            <span className="flex-1 text-left text-telegram-text">Maxfiylik</span>
            <ChevronRight size={20} className="text-telegram-text-secondary" />
          </button>
          <button 
            onClick={() => setShowAppearance(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-telegram-bg-lighter transition-colors border-b border-telegram-bg"
          >
            <Palette size={20} className="text-telegram-text-secondary" />
            <span className="flex-1 text-left text-telegram-text">Ko'rinish</span>
            <ChevronRight size={20} className="text-telegram-text-secondary" />
          </button>
          <button className="w-full flex items-center gap-4 p-4 hover:bg-telegram-bg-lighter transition-colors">
            <HelpCircle size={20} className="text-telegram-text-secondary" />
            <span className="flex-1 text-left text-telegram-text">Yordam</span>
            <ChevronRight size={20} className="text-telegram-text-secondary" />
          </button>
        </div>
      </div>

      {/* Settings Modals */}
      <AppearanceSettings isOpen={showAppearance} onClose={() => setShowAppearance(false)} />
      <PrivacySettings isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <NotificationSettings isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        {/* Logout */}
        <div className="px-4 mt-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
            <LogOut size={20} />
            <span>Hisobdan chiqish</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-blue" />
        </div>
      )}
    </div>
  );
};
