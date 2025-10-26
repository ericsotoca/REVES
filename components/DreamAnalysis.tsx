import React from 'react';
import { DreamAnalysisData, ChatMessage } from '../types';
import ChatWindow from './ChatWindow';
import { ResetIcon } from './Icons';

interface DreamAnalysisProps {
  data: DreamAnalysisData;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  onReset: () => void;
}

const DreamAnalysis: React.FC<DreamAnalysisProps> = ({ data, chatMessages, isChatLoading, onSendMessage, onReset }) => {
  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
       <div className="text-right mb-4">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-slate-200 rounded-md transition-colors"
        >
          <ResetIcon />
          Nouveau Rêve
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-indigo-300 mb-4">Votre Paysage Onirique</h2>
          <div className="aspect-square bg-stone-800 rounded-lg overflow-hidden shadow-2xl shadow-indigo-900/20">
            <img src={data.imageUrl} alt="AI generated representation of the dream" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-stone-900/50 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-2xl font-bold text-purple-300 mb-3">Transcription du Rêve</h3>
            <p className="text-slate-300 italic prose prose-invert max-w-none">"{data.transcription}"</p>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-2xl font-bold text-purple-300 mb-3">Thème Émotionnel Central</h3>
            <p className="text-slate-300 text-lg">{data.interpretation.theme}</p>
          </div>
          
          <div className="bg-stone-900/50 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-2xl font-bold text-purple-300 mb-3">Interprétation Psychologique</h3>
            <p className="text-slate-300 prose prose-invert max-w-none">{data.interpretation.interpretation}</p>
          </div>

          <div className="space-y-4 bg-stone-900/50 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-2xl font-bold text-purple-300">Symboles & Archétypes</h3>
            {data.interpretation.symbols.map((symbol, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-lg text-indigo-300">{symbol.name}</h4>
                <p className="text-slate-400"><span className="font-medium text-slate-300">Archétype :</span> {symbol.archetype}</p>
                <p className="text-slate-400">{symbol.meaning}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
             <h3 className="text-2xl font-bold text-purple-300 mb-3">Explorez Votre Rêve</h3>
             <p className="text-slate-400 mb-4">Posez des questions de suivi sur les symboles, les sentiments ou les personnages de votre rêve.</p>
            <ChatWindow 
              messages={chatMessages} 
              isLoading={isChatLoading}
              onSendMessage={onSendMessage} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamAnalysis;