"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  /** BCP-47 language tag (e.g. en-IN, hi-IN). Empty string = browser default. */
  lang?: string;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionAny = any;

export default function VoiceInput({ onResult, lang = "", className = "" }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionAny | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef("");
  const isListeningRef = useRef(false);
  const restartCountRef = useRef(0);
  const restartResetAtRef = useRef(0);
  const onResultRef = useRef(onResult);
  const langRef = useRef(lang);
  onResultRef.current = onResult;
  langRef.current = lang;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    if (langRef.current) recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 2;

    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      const results = event.results;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal && result[0]) {
          const t = (result[0].transcript ?? "").trim();
          if (t) transcriptRef.current += (transcriptRef.current ? " " : "") + t;
        }
      }
    };

    const maybeRestart = () => {
      const now = Date.now();
      if (now - restartResetAtRef.current > 3000) {
        restartCountRef.current = 0;
        restartResetAtRef.current = now;
      }
      restartCountRef.current++;
      if (restartCountRef.current <= 15 && isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) startRecognition();
        }, 100);
      } else {
        setListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (!isListeningRef.current) return;
      try {
        recognitionRef.current?.abort();
      } catch {}
      recognitionRef.current = null;
      const err = (event as { error?: string }).error;
      if (err === "no-speech" || err === "aborted") {
        maybeRestart();
        return;
      }
      setListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      if (!isListeningRef.current) return;
      recognitionRef.current = null;
      maybeRestart();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setListening(false);
      isListeningRef.current = false;
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return;
    transcriptRef.current = "";
    isListeningRef.current = true;
    restartCountRef.current = 0;
    restartResetAtRef.current = Date.now();
    setListening(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      requestAnimationFrame(() => {
        if (!isListeningRef.current) return;
        startRecognition();
      });
    } catch {
      setListening(false);
      isListeningRef.current = false;
    }
  }, [isSupported, startRecognition]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } catch {}
    try {
      recognitionRef.current?.abort();
    } catch {}
    recognitionRef.current = null;
    const text = transcriptRef.current.trim();
    if (text) onResultRef.current(text);
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      } catch {}
      try {
        recognitionRef.current?.abort();
      } catch {}
      recognitionRef.current = null;
    };
  }, []);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      className={`
        relative flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-200 touch-manipulation
        ${listening
          ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
          : "bg-white/[0.06] text-kh-text-dim hover:text-kh-text hover:bg-white/[0.1] border border-transparent"
        }
        ${className}
      `}
      aria-label={listening ? "Stop and send" : "Start voice input"}
      title={listening ? "Tap again to stop and send" : "Tap to speak (tap again to send)"}
    >
      {listening ? (
        <>
          <Square size={16} fill="currentColor" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Stop</span>
        </>
      ) : (
        <>
          <Mic size={18} />
          <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:inline">Voice</span>
        </>
      )}
    </button>
  );
}
