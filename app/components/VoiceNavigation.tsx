'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Conversational AI - Voice Navigation
 * 2026 Trend: Voice-first interaction
 */
export function VoiceNavigation() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    interface SpeechRecognitionType {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (event: any) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionType;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);

      // Navigate based on voice commands
      const lowerTranscript = transcriptText.toLowerCase();
      if (lowerTranscript.includes('홈') || lowerTranscript.includes('home')) {
        window.location.href = '/';
      } else if (lowerTranscript.includes('기능') || lowerTranscript.includes('features')) {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      } else if (lowerTranscript.includes('가격') || lowerTranscript.includes('pricing')) {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      } else if (lowerTranscript.includes('베타') || lowerTranscript.includes('beta')) {
        window.location.href = '/beta';
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        onClick={() => {
          toggleListening();
          triggerHaptic();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isListening
            ? 'bg-[#06B6D4] text-white'
            : 'bg-[#111] text-[#F5F5F0] border-2 border-[#06B6D4]/30'
        }`}
        aria-label="Voice Navigation"
      >
        {isListening ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </motion.button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-0 w-64 p-4 bg-[#111] rounded-lg border border-[#06B6D4]/30 shadow-xl"
          >
            <p className="text-sm text-[#F5F5F0] mb-2">듣는 중...</p>
            {transcript && (
              <p className="text-xs text-[#06B6D4]">{transcript}</p>
            )}
            <p className="text-xs text-[#F5F5F0]/60 mt-2">
              "기능", "가격", "베타" 등으로 말씀하세요
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
