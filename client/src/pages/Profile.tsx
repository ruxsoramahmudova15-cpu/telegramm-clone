import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Edit2, Phone, AtSign, Bell, Lock, Palette, HelpCircle, Info, ChevronRight, LogOut, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import api from '../services/api';

type EditingField = 'displayName' | 'username' | 'bio' | null;

export const Profile: React.FC = () => {
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      
      // Auto upload image
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data.success) {
        const pictureUrl = `${window.location.origin}/api/files/${uploadRes.data.file.id}/download`;
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
      setSelectedFile(null);
      setPreviewUrl(null);
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
    if (previewUrl) return <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />;
    if (profilePicture) return <img src={profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />;
    return <span className="text-4xl font-bold">{user?.displayName?.charAt(0).toUpperCase()}</span>;
  };

  // Editable field component
  const EditableField = ({ 
    field, 
    icon: Icon, 
    label, 
    value, 
    setValue, 
    placeholder,
    isTextarea = false 
  }: { 
    field: EditingField; 
    icon: any; 
    label: string; 
    value: string; 
    setValue: (v: string) => void;
    placeholder: string;
    isTextarea?: boolean;
  }) => (
    <div className="bg-telegram-bg-light rounded-xl p-4">
      <div className="flex items-start gap-4">
        <Icon size={20} className="text-telegram-text-secondary mt-1" />
        <div className="flex-1">
          {editingField === field ? (
            <div className="flex flex-col gap-2">
              {isTextarea ? (
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-telegram-bg text-telegram-text p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue resize-none"
                  placeholder={placeholder}
                  rows={3}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-telegram-bg text-telegram-text p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                  placeholder={placeholder}
                  autoFocus
                />
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleCancelEdit(field)}
                  className="p-2 rounded-lg bg-telegram-bg hover:bg-telegram-bg-lighter transition-colors"
                  disabled={isLoading}
                >
                  <X size={18} className="text-telegram-error" />
                </button>
                <button
                  onClick={() => handleSaveField(field)}
                  className="p-2 rounded-lg bg-telegram-blue hover:bg-telegram-blue-light transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={18} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-telegram-text">{value || placeholder}</p>
                <p className="text-sm text-telegram-text-secondary">{label}</p>
              </div>
              <button
                onClick={() => setEditingField(field)}
                className="p-2 rounded-lg hover:bg-telegram-bg transition-colors"
              >
                <Edit2 size={18} className="text-telegram-blue" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-telegram-bg pb-20">
      {/* Header */}
      <div className="bg-telegram-bg-light border-b border-telegram-bg-lighter sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors">
            <ArrowLeft size={24} className="text-telegram-text" />
          </button>
          <h1 className="text-xl font-bold text-telegram-text">Profil</h1>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-4 mt-4 p-3 rounded-xl ${message.type === 'success' ? 'bg-telegram-success/20 text-telegram-success' : 'bg-telegram-error/20 text-telegram-error'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-telegram-blue to-telegram-blue-light p-8 text-center">
        <div className="relative inline-block">
          <div onClick={handleImageClick} className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer overflow-hidden hover:opacity-90 transition-opacity">
            {getAvatarContent()}
          </div>
          <button onClick={handleImageClick} className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-telegram-bg-light flex items-center justify-center shadow-lg hover:bg-telegram-bg-lighter transition-colors">
            <Camera size={18} className="text-telegram-blue" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">{user?.displayName}</h2>
        <p className="text-white/70 mt-1">online</p>
      </div>

      {/* Profile Info - Editable Fields */}
      <div className="p-4 space-y-4">
        {/* Display Name */}
        <EditableField
          field="displayName"
          icon={Info}
          label="Ism"
          value={displayName}
          setValue={setDisplayName}
          placeholder="Ismingizni kiriting"
        />

        {/* Username */}
        <EditableField
          field="username"
          icon={AtSign}
          label="Username"
          value={username}
          setValue={setUsername}
          placeholder="Username kiriting"
        />

        {/* Phone - Not editable */}
        <div className="bg-telegram-bg-light rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Phone size={20} className="text-telegram-text-secondary" />
            <div className="flex-1">
              <p className="text-telegram-text">{user?.phone}</p>
              <p className="text-sm text-telegram-text-secondary">Telefon raqam</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <EditableField
          field="bio"
          icon={Info}
          label="Bio"
          value={bio}
          setValue={setBio}
          placeholder="O'zingiz haqingizda yozing..."
          isTextarea
        />
      </div>

      {/* Settings Menu */}
      <div className="p-4">
        <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
          {[
            { icon: <Bell size={20} />, label: 'Bildirishnomalar', path: '/settings' },
            { icon: <Lock size={20} />, label: 'Maxfiylik', path: '/settings' },
            { icon: <Palette size={20} />, label: 'Ko\'rinish', path: '/settings' },
            { icon: <HelpCircle size={20} />, label: 'Yordam', path: '/settings' },
          ].map((item, index) => (
            <button key={index} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 hover:bg-telegram-bg-lighter transition-colors border-b border-telegram-bg-lighter last:border-b-0">
              <span className="text-telegram-text-secondary">{item.icon}</span>
              <span className="flex-1 text-left text-telegram-text">{item.label}</span>
              <ChevronRight size={20} className="text-telegram-text-secondary" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="p-4">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-telegram-error/10 text-telegram-error hover:bg-telegram-error/20 transition-colors">
          <LogOut size={20} />
          <span>Hisobdan chiqish</span>
        </button>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-blue" />
        </div>
      )}
    </div>
  );
};
