import React, { useState, useCallback, useRef } from 'react';
import { AppState, DreamAnalysisData, ChatMessage } from './types';
import RecorderButton from './components/RecorderButton';
import DreamAnalysis from './components/DreamAnalysis';
import Spinner from './components/Spinner';
import { generateDreamImage, interpretDream, startChatSession } from './services/geminiService';
import { Chat } from '@google/genai';
import { StarryNightIcon } from './components/Icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<DreamAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  
  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysisData(null);
    setError(null);
    setChatMessages([]);
    chatRef.current = null;
  };

  const handleTranscriptionComplete = useCallback(async (transcription: string) => {
    if (!transcription.trim()) {
      setError("L'enregistrement était vide. Veuillez réessayer et parler distinctement.");
      setAppState(AppState.IDLE);
      return;
    }

    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const imagePrompt = `Une peinture numérique surréaliste, onirique, très détaillée, représentant les thèmes émotionnels centraux du rêve suivant : "${transcription}". Mettez l'accent sur le symbolisme, les concepts abstraits et une atmosphère mystique.`;
      
      const [imageUrl, interpretation, chat] = await Promise.all([
        generateDreamImage(imagePrompt),
        interpretDream(transcription),
        startChatSession(transcription)
      ]);

      setAnalysisData({
        transcription,
        imageUrl,
        interpretation,
      });
      chatRef.current = chat;
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de l'analyse de votre rêve. Veuillez réessayer.");
      setAppState(AppState.IDLE);
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chatRef.current || isChatLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message });
      let modelResponse = '';
      setChatMessages(prev => [...prev, { role: 'model', text: '...' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
            return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = { role: 'model', text: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer." };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [isChatLoading]);

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-indigo-300 mb-2">Déverrouillez Votre Monde Intérieur</h2>
            <p className="text-lg text-slate-400 mb-8">Appuyez sur le bouton et décrivez votre rêve tel que vous vous en souvenez.</p>
            <RecorderButton onTranscriptionComplete={handleTranscriptionComplete} setAppState={setAppState} setError={setError} />
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        );
      case AppState.RECORDING:
         return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-indigo-300 mb-2 animate-pulse">J'écoute...</h2>
            <p className="text-lg text-slate-400 mb-8">Décrivez votre rêve maintenant. Appuyez à nouveau sur le bouton pour arrêter.</p>
            <RecorderButton onTranscriptionComplete={handleTranscriptionComplete} setAppState={setAppState} setError={setError} isRecording />
          </div>
        );
      case AppState.PROCESSING:
        return <Spinner />;
      case AppState.RESULT:
        return analysisData && (
          <DreamAnalysis 
            data={analysisData} 
            chatMessages={chatMessages}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-slate-200 font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
           <div className="flex items-center justify-center gap-4 mb-4">
             <StarryNightIcon />
             <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">
              DreamWell AI
            </h1>
           </div>
          <p className="text-slate-400 text-lg">Enregistrez, Visualisez et Comprenez Vos Rêves.</p>
        </header>
        <div className="flex justify-center items-center min-h-[60vh]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;