import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Pause, Play } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Mikrofonga ruxsat berilmadi:', error);
      alert('Mikrofonga ruxsat bering');
    }
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

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      resetRecorder();
    }
  };

  const handleCancel = () => {
    stopRecording();
    resetRecorder();
    onCancel();
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    chunksRef.current = [];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initial state - show mic button
  if (!isRecording && !audioBlob) {
    return (
      <button
        type="button"
        onClick={startRecording}
        className="p-2 rounded-full hover:bg-[#17212b] transition-colors"
      >
        <Mic size={24} className="text-[#6c7883]" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-1">
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="p-2 rounded-full hover:bg-[#17212b] transition-colors"
      >
        <X size={20} className="text-red-400" />
      </button>

      {/* Recording indicator */}
      <div className="flex items-center gap-2 flex-1">
        {isRecording && (
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        )}
        <span className="text-white font-mono text-sm">{formatDuration(duration)}</span>
        
        {/* Waveform visualization */}
        <div className="flex-1 flex items-center gap-0.5 h-8">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-[#5ca0d3] rounded-full transition-all ${
                isRecording && !isPaused ? 'animate-pulse' : ''
              }`}
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      {isRecording ? (
        <>
          <button
            onClick={pauseRecording}
            className="p-2 rounded-full hover:bg-[#17212b] transition-colors"
          >
            {isPaused ? (
              <Play size={20} className="text-[#5ca0d3]" />
            ) : (
              <Pause size={20} className="text-[#5ca0d3]" />
            )}
          </button>
          <button
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <Square size={16} className="text-white" />
          </button>
        </>
      ) : audioBlob ? (
        <button
          onClick={handleSend}
          className="p-2 rounded-full bg-[#5ca0d3] hover:bg-[#4a8fc2] transition-colors"
        >
          <Send size={20} className="text-white" />
        </button>
      ) : null}
    </div>
  );
};

// Voice message bubble component
export const VoiceMessageBubble: React.FC<{
  audioUrl: string;
  duration: number;
  isOwn: boolean;
}> = ({ audioUrl, duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
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
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isOwn ? 'bg-white/20' : 'bg-[#5ca0d3]'
        }`}
      >
        {isPlaying ? (
          <Pause size={18} className="text-white" />
        ) : (
          <Play size={18} className="text-white ml-0.5" />
        )}
      </button>

      <div className="flex-1">
        {/* Waveform */}
        <div className="flex items-center gap-0.5 h-6 mb-1">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${
                i < (currentTime / duration) * 25 ? 'bg-white' : 'bg-white/30'
              }`}
              style={{ height: `${20 + Math.random() * 80}%` }}
            />
          ))}
        </div>
        <span className="text-xs text-white/70">
          {formatTime(isPlaying ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
};
