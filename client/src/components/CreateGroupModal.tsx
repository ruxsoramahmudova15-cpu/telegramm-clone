import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Search, Check, Plus, Camera, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { userApi, groupApi } from '../services/api';
import api from '../services/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated
}) => {
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPicture, setGroupPicture] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await userApi.search(searchQuery);
        if (response.success) {
          const filtered = response.users.filter(
            u => !selectedUsers.find(s => s.id === u.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedUsers]);

  const handleSelectUser = (user: User) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleNext = () => {
    if (selectedUsers.length > 0) {
      setStep('details');
    }
  };

  const handleBack = () => {
    setStep('members');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Rasm hajmi 5MB dan oshmasligi kerak');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          const pictureUrl = `http://localhost:5000/api/files/${uploadRes.data.file.id}/download`;
          setGroupPicture(pictureUrl);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError('Rasm yuklashda xatolik');
      }
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await groupApi.create({
        name: groupName.trim(),
        participantIds: selectedUsers.map(u => u.id),
        description: groupDescription.trim() || undefined,
        picture: groupPicture || undefined
      });
      
      if (response.success) {
        onGroupCreated(response.group);
        handleClose();
      }
    } catch (error: any) {
      console.error('Create group error:', error);
      setError(error.response?.data?.message || 'Guruh yaratishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('members');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
    setGroupDescription('');
    setGroupPicture('');
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#0e1621]">
          {step === 'details' && (
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
              <ArrowLeft size={20} className="text-[#6c7883]" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-[#5ca0d3] flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white">
              {step === 'members' ? 'Yangi guruh' : 'Guruh ma\'lumotlari'}
            </h2>
            <p className="text-sm text-[#6c7883]">
              {step === 'members' 
                ? `${selectedUsers.length} ta a'zo tanlandi`
                : 'Guruh nomini kiriting'}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
            <X size={20} className="text-[#6c7883]" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'members' ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7883]" />
                <input
                  type="text"
                  placeholder="Foydalanuvchi qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#242f3d] text-white placeholder-[#6c7883] focus:outline-none focus:ring-2 focus:ring-[#5ca0d3]/50"
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5ca0d3]/20 text-[#5ca0d3]"
                    >
                      <span className="text-sm">{user.displayName}</span>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-1">
                {isSearching ? (
                  <div className="text-center py-4 text-[#6c7883]">Qidirilmoqda...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-[#232e3c] rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center text-white font-medium overflow-hidden">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{user.displayName}</p>
                        <p className="text-sm text-[#6c7883]">@{user.username}</p>
                      </div>
                      <Plus size={20} className="text-[#5ca0d3]" />
                    </button>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-4 text-[#6c7883]">Foydalanuvchi topilmadi</div>
                ) : (
                  <div className="text-center py-8 text-[#6c7883]">
                    <Users size={48} className="mx-auto mb-3 opacity-30" />
                    <p>A'zolarni qidirish uchun yozing</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Group Picture */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div 
                    onClick={handleImageClick}
                    className="w-24 h-24 rounded-full bg-[#232e3c] flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    {previewUrl || groupPicture ? (
                      <img src={previewUrl || groupPicture} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={40} className="text-[#6c7883]" />
                    )}
                  </div>
                  <button 
                    onClick={handleImageClick}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5ca0d3] flex items-center justify-center shadow-lg hover:bg-[#4a8fc2] transition-colors"
                  >
                    <Camera size={16} className="text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              </div>

              {/* Group Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#6c7883] mb-2">Guruh nomi</label>
                <input
                  type="text"
                  placeholder="Guruh nomini kiriting"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#242f3d] text-white placeholder-[#6c7883] focus:outline-none focus:ring-2 focus:ring-[#5ca0d3]/50"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#6c7883] mb-2">Tavsif (ixtiyoriy)</label>
                <textarea
                  placeholder="Guruh haqida qisqacha ma'lumot"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#242f3d] text-white placeholder-[#6c7883] focus:outline-none focus:ring-2 focus:ring-[#5ca0d3]/50 resize-none"
                />
              </div>

              {/* Selected Members Preview */}
              <div>
                <p className="text-sm font-medium text-[#6c7883] mb-2">A'zolar ({selectedUsers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#232e3c] text-[#6c7883] text-sm">
                      {user.displayName}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#0e1621]">
          <button
            onClick={step === 'details' ? handleBack : handleClose}
            className="px-6 py-2.5 rounded-xl bg-[#232e3c] text-white hover:bg-[#2b3a4d] transition-colors"
          >
            {step === 'details' ? 'Orqaga' : 'Bekor qilish'}
          </button>
          <button
            onClick={step === 'members' ? handleNext : handleCreate}
            disabled={step === 'members' ? selectedUsers.length === 0 : !groupName.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl bg-[#5ca0d3] text-white hover:bg-[#4a8fc2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yaratilmoqda...
              </>
            ) : step === 'members' ? (
              <>Keyingi <Check size={18} /></>
            ) : (
              <>Yaratish <Check size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
