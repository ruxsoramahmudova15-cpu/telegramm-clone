import React from 'react';
import { 
  FileText, FileImage, FileVideo, FileAudio, FileArchive, 
  File, Download, Check, CheckCheck, Clock 
} from 'lucide-react';
import { MessageStatus } from '../types';

interface FileMessageBubbleProps {
  content: string;
  isOwn: boolean;
  time: string;
  status?: MessageStatus;
}

// Parse file info from message content
// Format: FILE:url|name|size|mimeType
const parseFileInfo = (content: string) => {
  if (content.startsWith('FILE:')) {
    const parts = content.substring(5).split('|');
    return {
      url: parts[0] || '',
      name: parts[1] || 'Fayl',
      size: parseInt(parts[2]) || 0,
      mimeType: parts[3] || 'application/octet-stream'
    };
  }
  // Legacy format: 📎 Fayl: filename
  if (content.startsWith('📎 Fayl:')) {
    return {
      url: '',
      name: content.replace('📎 Fayl:', '').trim(),
      size: 0,
      mimeType: 'application/octet-stream'
    };
  }
  return null;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return FileArchive;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText;
  return File;
};

// Get file icon color based on mime type
const getFileIconColor = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'text-green-400';
  if (mimeType.startsWith('video/')) return 'text-purple-400';
  if (mimeType.startsWith('audio/')) return 'text-orange-400';
  if (mimeType.includes('pdf')) return 'text-red-400';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-yellow-400';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-400';
  return 'text-[#5ca0d3]';
};

// Get file extension
const getFileExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  return ext.length > 4 ? ext.substring(0, 4) : ext;
};

// Message Status Icon
const MessageStatusIcon: React.FC<{ status?: MessageStatus; isOwn: boolean }> = ({ status, isOwn }) => {
  if (!isOwn) return null;
  switch (status) {
    case 'sending': return <Clock size={14} className="text-white/40" />;
    case 'sent': return <Check size={14} className="text-white/50" />;
    case 'delivered': return <CheckCheck size={14} className="text-white/50" />;
    case 'seen': return <CheckCheck size={14} className="text-[#5ca0d3]" />;
    default: return <Check size={14} className="text-white/50" />;
  }
};

export const FileMessageBubble: React.FC<FileMessageBubbleProps> = ({
  content,
  isOwn,
  time,
  status
}) => {
  const fileInfo = parseFileInfo(content);
  
  if (!fileInfo) {
    // Fallback for unknown format
    return (
      <div className={`relative px-3 py-2 rounded-2xl ${isOwn ? 'bg-[#2b5278]' : 'bg-[#182533]'}`}>
        <p className="text-white text-[15px]">{content}</p>
      </div>
    );
  }

  const FileIcon = getFileIcon(fileInfo.mimeType);
  const iconColor = getFileIconColor(fileInfo.mimeType);
  const extension = getFileExtension(fileInfo.name);

  const handleDownload = () => {
    if (fileInfo.url) {
      const link = document.createElement('a');
      link.href = fileInfo.url;
      link.download = fileInfo.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden ${isOwn ? 'bg-[#2b5278]' : 'bg-[#182533]'}`}>
      <div className="flex items-center gap-3 p-3 min-w-[240px]">
        {/* File Icon */}
        <div className={`relative w-12 h-12 rounded-xl ${isOwn ? 'bg-[#1e3a52]' : 'bg-[#0e1621]'} flex items-center justify-center flex-shrink-0`}>
          <FileIcon size={24} className={iconColor} />
          {extension && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#5ca0d3] text-white rounded">
              {extension}
            </span>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0 pr-8">
          <p className="text-white font-medium text-[14px] truncate" title={fileInfo.name}>
            {fileInfo.name}
          </p>
          <p className="text-[#6c7883] text-[12px]">
            {formatFileSize(fileInfo.size)}
          </p>
        </div>

        {/* Download Button */}
        {fileInfo.url && (
          <button
            onClick={handleDownload}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isOwn ? 'bg-[#1e3a52] hover:bg-[#254a6a]' : 'bg-[#0e1621] hover:bg-[#1a2836]'
            }`}
            title="Yuklab olish"
          >
            <Download size={18} className="text-[#5ca0d3]" />
          </button>
        )}
      </div>

      {/* Time and Status */}
      <div className={`absolute bottom-2 right-3 flex items-center gap-1 text-[11px] ${
        isOwn ? 'text-white/50' : 'text-[#6c7883]'
      }`}>
        {time}
        <MessageStatusIcon status={status} isOwn={isOwn} />
      </div>
    </div>
  );
};

// Check if message is a file message
export const isFileMessage = (content: string, messageType?: string): boolean => {
  if (messageType === 'file') return true;
  if (content.startsWith('FILE:')) return true;
  if (content.startsWith('📎 Fayl:')) return true;
  return false;
};
