import React, { useState, useRef, useEffect } from 'react';
import { Video, X, Send, Play, Pause, RotateCcw } from 'lucide-react';

interface VideoRecorderProps {
  onSend: (videoBlob: Blob, duration: number, thumbnail: string) => void;
  onCancel: () => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
        audio: true
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Kameraga ruxsat berilmadi:', error);
      alert('Kameraga ruxsat bering');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };

    mediaRecorder.start(100);
    setIsRecording(true);
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration(prev => {
        if (prev >= 60) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const generateThumbnail = (): string => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(videoRef.current, 0, 0, 200, 200);
        return canvas.toDataURL('image/jpeg', 0.7);
      }
    }
    return '';
  };

  const handleSend = () => {
    if (videoBlob) {
      const thumbnail = generateThumbnail();
      onSend(videoBlob, duration, thumbnail);
      handleCancel();
    }
  };

  const handleCancel = () => {
    cleanup();
    setVideoBlob(null);
    setPreviewUrl(null);
    setShowCamera(false);
    setIsRecording(false);
    setDuration(0);
    onCancel();
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideoBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initial button
  if (!showCamera && !previewUrl) {
    return (
      <button
        type="button"
        onClick={startCamera}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#232e3c] text-white text-sm"
        title="Aylana video"
      >
        <Video size={20} className="text-[#5ca0d3]" />
        Aylana video
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="relative">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>

        {/* Video container - circular */}
        <div className="relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] rounded-full overflow-hidden border-4 border-[#5ca0d3]">
          {previewUrl ? (
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full h-full object-cover"
              loop
              autoPlay
              muted
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-sm font-mono">{formatDuration(duration)}</span>
            </div>
          )}

          {/* Max duration indicator */}
          {isRecording && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="w-[200px] h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#5ca0d3] transition-all"
                  style={{ width: `${(duration / 60) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {!previewUrl ? (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-white" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={retake}
                className="p-4 rounded-full bg-[#232e3c] hover:bg-[#2b3a4d] transition-colors"
              >
                <RotateCcw size={24} className="text-white" />
              </button>
              <button
                onClick={handleSend}
                className="p-4 rounded-full bg-[#5ca0d3] hover:bg-[#4a8fc2] transition-colors"
              >
                <Send size={24} className="text-white" />
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[#6c7883] text-sm mt-4">
          {isRecording ? 'Yozib olish uchun bosing' : previewUrl ? 'Yuborish yoki qayta yozish' : 'Yozishni boshlash uchun bosing'}
        </p>
      </div>
    </div>
  );
};

// Video message bubble - circular like Telegram
export const VideoMessageBubble: React.FC<{
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  isOwn: boolean;
}> = ({ videoUrl, thumbnail, duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative w-[200px] h-[200px] rounded-full overflow-hidden cursor-pointer border-2 border-[#5ca0d3]"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnail}
        className="w-full h-full object-cover"
        loop
        playsInline
        onEnded={() => setIsPlaying(false)}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={24} className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
        {formatTime(duration)}
      </div>
    </div>
  );
};
