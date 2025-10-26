import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { MicrophoneIcon } from './Icons';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { encode, createBlob } from '../utils/audioUtils';

interface RecorderButtonProps {
  onTranscriptionComplete: (transcription: string) => void;
  setAppState: (state: AppState) => void;
  setError: (error: string | null) => void;
  isRecording?: boolean;
}

const RecorderButton: React.FC<RecorderButtonProps> = ({ onTranscriptionComplete, setAppState, setError, isRecording = false }) => {
  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptionRef = useRef<string>('');
  
  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setAppState(AppState.IDLE);
    onTranscriptionComplete(transcriptionRef.current);
    transcriptionRef.current = '';
  }, [onTranscriptionComplete, setAppState]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAppState(AppState.RECORDING);
    transcriptionRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO], // Required but we only need transcription
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => console.log('Live session opened.'),
            onclose: () => console.log('Live session closed.'),
            onerror: (e) => {
              console.error('Live session error:', e);
              setError('Une erreur de connexion est survenue. Veuillez réessayer.');
              stopRecording();
            },
            onmessage: (message: LiveServerMessage) => {
              if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                transcriptionRef.current += text;
              }
            }
          }
      });

      sessionRef.current = await sessionPromise;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        if (sessionRef.current) {
            sessionRef.current.sendRealtimeInput({ media: pcmBlob });
        }
      };
      source.connect(processor);
      processor.connect(context.destination);

    } catch (err) {
      console.error('Failed to start recording', err);
      setError("Impossible d'accéder au microphone. Veuillez accorder la permission et réessayer.");
      setAppState(AppState.IDLE);
    }
  }, [setAppState, setError, stopRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
       if (isRecording) {
         stopRecording();
       }
    };
  }, [isRecording, stopRecording]);


  return (
    <button
      onClick={toggleRecording}
      className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg
      ${isRecording 
        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' 
        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/50'}`}
      aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
    >
      {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping"></span>}
      <MicrophoneIcon />
    </button>
  );
};

export default RecorderButton;