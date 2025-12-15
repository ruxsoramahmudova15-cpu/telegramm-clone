import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Camera, Edit2, Check, UserPlus, Crown, LogOut, Trash2, Search, MoreVertical } from 'lucide-react';
import { Conversation, GroupMember, User } from '../types';
import { groupApi, userApi } from '../services/api';
import api from '../services/api';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: string;
  onGroupUpdated: (group: any) => void;
  onLeaveGroup: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onGroupUpdated,
  onLeaveGroup
}) => {
  const [groupData, setGroupData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [memberMenu, setMemberMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = groupData?.admins?.includes(currentUserId);

  useEffect(() => {
    if (isOpen && conversation.id) {
      loadGroupData();
    }
  }, [isOpen, conversation.id]);

  const loadGroupData = async () => {
    setIsLoading(true);
    try {
      const response = await groupApi.get(conversation.id);
      if (response.success) {
        setGroupData(response.group);
        setEditName(response.group.name || '');
        setEditDescription(response.group.description || '');
      }
    } catch (error) {
      console.error('Load group error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search users for adding
  useEffect(() => {
    if (!showAddMember || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      try {
        const response = await userApi.search(searchQuery);
        if (response.success) {
          const filtered = response.users.filter(
            u => !groupData?.participants?.includes(u.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, showAddMember, groupData?.participants]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    try {
      const response = await groupApi.update(conversation.id, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      if (response.success) {
        setGroupData((prev: any) => ({ ...prev, name: editName, description: editDescription }));
        onGroupUpdated(response.group);
        setIsEditing(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data.success) {
        const pictureUrl = `http://localhost:5000/api/files/${uploadRes.data.file.id}/download`;
        const response = await groupApi.update(conversation.id, { picture: pictureUrl });
        if (response.success) {
          setGroupData((prev: any) => ({ ...prev, picture: pictureUrl }));
          onGroupUpdated(response.group);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleAddMember = async (user: User) => {
    try {
      const response = await groupApi.addMember(conversation.id, user.id);
      if (response.success) {
        await loadGroupData();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await groupApi.removeMember(conversation.id, userId);
      if (response.success) {
        await loadGroupData();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
    }
    setMemberMenu(null);
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      const response = await groupApi.makeAdmin(conversation.id, userId);
      if (response.success) {
        await loadGroupData();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
    }
    setMemberMenu(null);
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      const response = await groupApi.removeAdmin(conversation.id, userId);
      if (response.success) {
        await loadGroupData();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
    }
    setMemberMenu(null);
  };

  const handleLeave = async () => {
    if (!confirm('Guruhdan chiqmoqchimisiz?')) return;
    try {
      const response = await groupApi.leave(conversation.id);
      if (response.success) {
        onLeaveGroup();
        onClose();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <h3 className="text-white font-medium text-lg">Guruh ma'lumotlari</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
            <X size={20} className="text-[#6c7883]" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/20 text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Yopish</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-[#5ca0d3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Group Info */}
            <div className="p-6 flex flex-col items-center border-b border-[#0e1621]">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center overflow-hidden">
                  {groupData?.picture ? (
                    <img src={groupData.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={40} className="text-white" />
                  )}
                </div>
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5ca0d3] flex items-center justify-center"
                    >
                      <Camera size={16} className="text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </>
                )}
              </div>

              {isEditing ? (
                <div className="w-full space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[#242f3d] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#5ca0d3]/50"
                    placeholder="Guruh nomi"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[#242f3d] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#5ca0d3]/50 resize-none"
                    placeholder="Tavsif"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl bg-[#232e3c] text-white">
                      Bekor
                    </button>
                    <button onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-[#5ca0d3] text-white flex items-center gap-2">
                      <Check size={16} /> Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-white">{groupData?.name}</h2>
                    {isAdmin && (
                      <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-[#232e3c]">
                        <Edit2 size={16} className="text-[#5ca0d3]" />
                      </button>
                    )}
                  </div>
                  {groupData?.description && (
                    <p className="text-[#6c7883] text-sm mt-1 text-center">{groupData.description}</p>
                  )}
                  <p className="text-[#6c7883] text-sm mt-2">{groupData?.members?.length || 0} a'zo</p>
                </>
              )}
            </div>

            {/* Members Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#6c7883] text-sm font-medium">A'zolar</h3>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="flex items-center gap-1 text-[#5ca0d3] text-sm hover:underline"
                  >
                    <UserPlus size={16} /> Qo'shish
                  </button>
                )}
              </div>

              {/* Add Member Search */}
              {showAddMember && (
                <div className="mb-4">
                  <div className="relative mb-2">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7883]" />
                    <input
                      type="text"
                      placeholder="Foydalanuvchi qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#242f3d] text-white text-sm placeholder-[#6c7883] focus:outline-none"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="bg-[#232e3c] rounded-xl overflow-hidden">
                      {searchResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleAddMember(user)}
                          className="w-full p-2 flex items-center gap-2 hover:bg-[#2b3a4d] transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center text-white text-sm">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm">{user.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1">
                {groupData?.members?.map((member: GroupMember) => {
                  const isMemberAdmin = groupData.admins?.includes(member.id);
                  const isCurrentUser = member.id === currentUserId;
                  
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#232e3c] transition-colors">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5ca0d3] to-[#8774e1] flex items-center justify-center text-white overflow-hidden">
                          {member.profilePicture ? (
                            <img src={member.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            member.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212b]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{member.displayName}</p>
                          {isMemberAdmin && <Crown size={14} className="text-yellow-500" />}
                        </div>
                        <p className="text-[#6c7883] text-sm">@{member.username}</p>
                      </div>
                      {isAdmin && !isCurrentUser && (
                        <div className="relative">
                          <button 
                            onClick={() => setMemberMenu(memberMenu === member.id ? null : member.id)}
                            className="p-2 rounded-full hover:bg-[#2b3a4d]"
                          >
                            <MoreVertical size={16} className="text-[#6c7883]" />
                          </button>
                          {memberMenu === member.id && (
                            <div className="absolute right-0 top-full mt-1 bg-[#232e3c] rounded-xl shadow-xl py-1 min-w-[160px] z-10">
                              {isMemberAdmin ? (
                                <button
                                  onClick={() => handleRemoveAdmin(member.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#2b3a4d] flex items-center gap-2"
                                >
                                  <Crown size={14} /> Adminlikni olish
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMakeAdmin(member.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#2b3a4d] flex items-center gap-2"
                                >
                                  <Crown size={14} /> Admin qilish
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#2b3a4d] flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Guruhdan chiqarish
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Group */}
            <div className="p-4 border-t border-[#0e1621]">
              <button
                onClick={handleLeave}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={18} /> Guruhdan chiqish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
