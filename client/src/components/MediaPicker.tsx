import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Video, ZoomIn, ZoomOut, RotateCw, Play, Pause, Volume2, VolumeX } from 'lucide-react';

type MediaType = 'image' | 'video';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (mediaUrl: string, fileName: string, type: MediaType) => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({ isOpen, onClose, onSend }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      setMediaType('image');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      setMediaType('image');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
        const mediaUrl = `http://localhost:5000/api/files/${data.file.id}/download`;
        onSend(mediaUrl, selectedFile.name, mediaType);
        handleClose();
      }
    } catch (error) {
      console.error('Media upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl && mediaType === 'video') {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setZoom(1);
    setRotation(0);
    setVideoDuration(0);
    setIsPlaying(false);
    onClose();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (previewUrl && mediaType === 'video') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <h3 className="text-white font-medium text-lg">
            {mediaType === 'video' ? 'Video yuborish' : 'Rasm yuborish'}
          </h3>
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
              <div className="flex gap-4 mb-4">
                <ImageIcon size={48} className="text-[#5ca0d3]" />
                <Video size={48} className="text-[#8774e1]" />
              </div>
              <p className="text-white text-lg mb-2 text-center">Rasm yoki video tanlang</p>
              <p className="text-[#6c7883] text-sm text-center">PNG, JPG, GIF, WEBP, MP4, WEBM (max 50MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : mediaType === 'image' ? (
            /* Image Preview */
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-[#0e1621] rounded-xl overflow-hidden relative min-h-[250px]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
              </div>

              {/* Image Controls */}
              <div className="flex items-center justify-center gap-2 py-3">
                <button onClick={handleZoomOut} className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors" title="Kichiklashtirish">
                  <ZoomOut size={18} className="text-white" />
                </button>
                <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors" title="Kattalashtirish">
                  <ZoomIn size={18} className="text-white" />
                </button>
                <div className="w-px h-6 bg-[#0e1621] mx-2" />
                <button onClick={handleRotate} className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors" title="Aylantirish">
                  <RotateCw size={18} className="text-white" />
                </button>
                <div className="w-px h-6 bg-[#0e1621] mx-2" />
                <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} className="px-3 py-1.5 rounded-lg bg-[#232e3c] hover:bg-[#2b3a4d] text-white text-sm transition-colors">
                  Boshqa fayl
                </button>
              </div>

              <div className="text-center text-[#6c7883] text-sm pb-2">
                {selectedFile?.name} • {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ) : (
            /* Video Preview */
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-[#0e1621] rounded-xl overflow-hidden relative min-h-[250px]">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="max-w-full max-h-full object-contain"
                  onLoadedMetadata={(e) => setVideoDuration((e.target as HTMLVideoElement).duration)}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                />
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </div>
                  </button>
                )}
              </div>

              {/* Video Controls */}
              <div className="flex items-center justify-center gap-2 py-3">
                <button onClick={togglePlay} className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors">
                  {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
                </button>
                <span className="text-white text-sm px-2">{formatDuration(videoDuration)}</span>
                <button onClick={toggleMute} className="p-2 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors">
                  {isMuted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
                </button>
                <div className="w-px h-6 bg-[#0e1621] mx-2" />
                <button onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelectedFile(null); }} className="px-3 py-1.5 rounded-lg bg-[#232e3c] hover:bg-[#2b3a4d] text-white text-sm transition-colors">
                  Boshqa fayl
                </button>
              </div>

              <div className="text-center text-[#6c7883] text-sm pb-2">
                <Video size={14} className="inline mr-1" />
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


// Video Message Bubble Component with Thumbnail
export const VideoMessageBubble: React.FC<{
  videoUrl: string;
  isOwn: boolean;
  time: string;
  status?: string;
}> = ({ videoUrl, isOwn, time, status }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(true);
  };

  return (
    <>
      <div 
        className={`relative rounded-xl overflow-hidden cursor-pointer max-w-[280px] sm:max-w-[320px] ${
          isOwn ? 'bg-[#2b5278]' : 'bg-[#182533]'
        }`}
        onClick={handlePlay}
      >
        {hasError ? (
          <div className="w-full h-[200px] flex items-center justify-center bg-[#232e3c]">
            <p className="text-[#6c7883] text-sm">Video yuklanmadi</p>
          </div>
        ) : (
          <div className="relative">
            {/* Video preview with poster */}
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto min-h-[100px] max-h-[300px] object-cover"
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                setDuration(video.duration);
                setIsVideoLoaded(true);
              }}
              onError={() => setHasError(true)}
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            </div>
            {/* Duration badge */}
            {isVideoLoaded && duration > 0 && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[11px] text-white">
                <Video size={12} />
                {formatDuration(duration)}
              </div>
            )}
          </div>
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

      {/* Fullscreen Video Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            onClick={() => setIsFullscreen(false)}
          >
            <X size={24} className="text-white" />
          </button>
          <video
            ref={fullscreenVideoRef}
            src={videoUrl}
            className="max-w-full max-h-full object-contain"
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// Re-export ImageMessageBubble for backward compatibility
export { ImageMessageBubble } from './ImagePicker';
