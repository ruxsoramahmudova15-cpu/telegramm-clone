import React, { useState, useRef } from 'react';
import { X, Upload, FileText, FileImage, FileVideo, FileAudio, FileArchive, File } from 'lucide-react';

interface FilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (file: File) => void;
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
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
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return FileArchive;
  if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
};

// Get file icon color
const getFileIconColor = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'text-green-400';
  if (mimeType.startsWith('video/')) return 'text-purple-400';
  if (mimeType.startsWith('audio/')) return 'text-orange-400';
  if (mimeType.includes('pdf')) return 'text-red-400';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-yellow-400';
  return 'text-[#5ca0d3]';
};

export const FilePicker: React.FC<FilePickerProps> = ({ isOpen, onClose, onSend }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Fayl hajmi 50MB dan oshmasligi kerak');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Fayl hajmi 50MB dan oshmasligi kerak');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSend = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await onSend(selectedFile);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : File;
  const iconColor = selectedFile ? getFileIconColor(selectedFile.type) : 'text-[#5ca0d3]';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <h3 className="text-white font-medium text-lg">Fayl yuborish</h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
            <X size={20} className="text-[#6c7883]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {selectedFile ? (
            <div className="bg-[#232e3c] rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#17212b] flex items-center justify-center">
                  <FileIcon size={32} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-[#6c7883] text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-full hover:bg-[#17212b] transition-colors"
                >
                  <X size={18} className="text-[#6c7883]" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-[#5ca0d3] bg-[#5ca0d3]/10' : 'border-[#6c7883] hover:border-[#5ca0d3]'
              }`}
            >
              <Upload size={48} className="mx-auto mb-4 text-[#6c7883]" />
              <p className="text-white mb-2">Faylni bu yerga tashlang</p>
              <p className="text-[#6c7883] text-sm">yoki bosib tanlang</p>
              <p className="text-[#6c7883] text-xs mt-4">Maksimal hajm: 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#0e1621]">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-[#232e3c] text-white hover:bg-[#2b3a4d] transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedFile || isUploading}
            className="px-6 py-2.5 rounded-xl bg-[#5ca0d3] text-white hover:bg-[#4a8fc2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              'Yuborish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
