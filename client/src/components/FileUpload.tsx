import React, { useRef, useState } from 'react';
import { Paperclip, X, File, Image, FileText, Film, Music, Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = '*/*',
  maxSize = 50
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fayl hajmi ${maxSize}MB dan oshmasligi kerak`);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Fayl yuklashda xatolik');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : File;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-telegram-blue bg-telegram-blue/10' 
              : 'border-telegram-bg-lighter hover:border-telegram-blue/50 hover:bg-telegram-bg-lighter'
            }
          `}
        >
          <Upload size={40} className="mx-auto mb-3 text-telegram-text-secondary" />
          <p className="text-telegram-text font-medium">
            Fayl tanlash yoki bu yerga tashlang
          </p>
          <p className="text-sm text-telegram-text-secondary mt-1">
            Maksimal hajm: {maxSize}MB
          </p>
        </div>
      ) : (
        <div className="bg-telegram-bg-lighter rounded-xl p-4">
          <div className="flex items-start gap-4">
            {/* Preview or Icon */}
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-telegram-bg flex items-center justify-center">
                <FileIcon size={32} className="text-telegram-blue" />
              </div>
            )}

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-telegram-text truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-telegram-text-secondary">
                {formatFileSize(selectedFile.size)}
              </p>
              {error && (
                <p className="text-sm text-telegram-error mt-1">{error}</p>
              )}
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-telegram-bg transition-colors"
            >
              <X size={20} className="text-telegram-text-secondary" />
            </button>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={handleCancel} disabled={isUploading}>
              Bekor qilish
            </Button>
            <Button onClick={handleUpload} isLoading={isUploading}>
              {isUploading ? 'Yuklanmoqda...' : 'Yuborish'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline file attachment button for chat input
export const FileAttachButton: React.FC<{
  onFileSelect: (file: File) => void;
}> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
      >
        <Paperclip size={24} className="text-telegram-text-secondary" />
      </button>
    </>
  );
};