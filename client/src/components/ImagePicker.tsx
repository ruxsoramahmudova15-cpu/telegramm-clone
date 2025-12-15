import React, { useState, useRef } from 'react';
import { X, Send, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (imageUrl: string, fileName: string) => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ isOpen, onClose, onSend }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        const imageUrl = `http://localhost:5000/api/files/${data.file.id}/download`;
        onSend(imageUrl, selectedFile.name);
        handleClose();
      }
    } catch (error) {
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setZoom(1);
    setRotation(0);
    onClose();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <h3 className="text-white font-medium text-lg">Rasm yuborish</h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-[#232e3c] transition-colors">
            <X size={20} className="text-[#6c7883]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {!previewUrl ? (
            /* Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="h-full min-h-[300px] border-2 border-dashed border-[#5ca0d3] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#232e3c]/50 transition-colors"
            >
              <ImageIcon size={64} className="text-[#5ca0d3] mb-4" />
              <p className="text-white text-lg mb-2">Rasmni tanlang yoki bu yerga tashlang</p>
              <p className="text-[#6c7883] text-sm">PNG, JPG, GIF, WEBP (max 50MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview */
            <div className="h-full flex flex-col">
              {/* Image Preview */}
              <div className="flex-1 flex items-center justify-center bg-[#0e1621] rounded-xl overflow-hidden relative min-h-[250px]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                  }}
                />
              </div>

              {/* Image Controls */}
              <div className="flex items-center justify-center gap-2 py-3">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors"
                  title="Kichiklashtirish"
                >
                  <ZoomOut size={18} className="text-white" />
                </button>
                <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors"
                  title="Kattalashtirish"
                >
                  <ZoomIn size={18} className="text-white" />
                </button>
                <div className="w-px h-6 bg-[#0e1621] mx-2" />
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors"
                  title="Aylantirish"
                >
                  <RotateCw size={18} className="text-white" />
                </button>
                <div className="w-px h-6 bg-[#0e1621] mx-2" />
                <button
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                  className="px-3 py-1.5 rounded-lg bg-[#232e3c] hover:bg-[#2b3a4d] text-white text-sm transition-colors"
                >
                  Boshqa rasm
                </button>
              </div>

              {/* File Info */}
              <div className="text-center text-[#6c7883] text-sm pb-2">
                {selectedFile?.name} • {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewUrl && (
          <div className="p-4 border-t border-[#0e1621]">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Izoh qo'shish (ixtiyoriy)..."
                className="flex-1 bg-[#242f3d] text-white placeholder-[#6c7883] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5ca0d3]/50"
              />
              <button
                onClick={handleSend}
                disabled={isUploading}
                className="p-3 rounded-xl bg-[#5ca0d3] hover:bg-[#4a8fc2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={24} className="text-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Image Message Bubble Component
export const ImageMessageBubble: React.FC<{
  imageUrl: string;
  isOwn: boolean;
  time: string;
  status?: string;
}> = ({ imageUrl, isOwn, time, status }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      <div 
        className={`relative rounded-xl overflow-hidden cursor-pointer max-w-[280px] sm:max-w-[320px] ${
          isOwn ? 'bg-[#2b5278]' : 'bg-[#182533]'
        }`}
        onClick={() => !hasError && setIsFullscreen(true)}
      >
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#232e3c]">
            <div className="w-8 h-8 border-2 border-[#5ca0d3] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {hasError ? (
          <div className="w-full h-[200px] flex items-center justify-center bg-[#232e3c]">
            <p className="text-[#6c7883] text-sm">Rasm yuklanmadi</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Sent image"
            crossOrigin="anonymous"
            className={`w-full h-auto min-h-[100px] max-h-[400px] object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={(e) => { 
              console.error('Image load error:', imageUrl, e); 
              setIsLoading(false); 
              setHasError(true); 
            }}
          />
        )}
        {/* Time overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded text-[11px] text-white">
          {time}
          {isOwn && status === 'seen' && (
            <svg className="w-4 h-4 text-[#5ca0d3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
              <path d="M15 6L4 17" />
            </svg>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <X size={24} className="text-white" />
          </button>
          <img
            src={imageUrl}
            alt="Fullscreen"
            crossOrigin="anonymous"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};
