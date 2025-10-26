import { GoogleGenAI, Type, Chat } from '@google/genai';
import { DreamInterpretation } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const interpretationSchema = {
  type: Type.OBJECT,
  properties: {
    theme: {
      type: Type.STRING,
      description: 'Un résumé concis du thème émotionnel central du rêve.'
    },
    symbols: {
      type: Type.ARRAY,
      description: 'Un tableau des symboles ou éléments significatifs du rêve.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Le nom du symbole (par exemple, "un grand arbre", "une clé").'
          },
          meaning: {
            type: Type.STRING,
            description: 'La signification psychologique potentielle de ce symbole dans le contexte du rêve.'
          },
          archetype: {
            type: Type.STRING,
            description: 'L\'archétype jungien pertinent, le cas échéant (par exemple, "L\'Ombre", "L\'Anima/Animus", "Le Soi").'
          }
        },
        required: ['name', 'meaning', 'archetype']
      }
    },
    interpretation: {
      type: Type.STRING,
      description: 'Une interprétation psychologique détaillée du rêve basée sur les principes jungiens, intégrant les symboles et le thème.'
    }
  },
  required: ['theme', 'symbols', 'interpretation']
};

export async function generateDreamImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
    });
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate dream image.');
  }
}

export async function interpretDream(dreamText: string): Promise<DreamInterpretation> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analysez le rêve suivant d'un point de vue psychologique jungien, en français. Identifiez les archétypes clés, les symboles et leurs significations potentielles. Fournissez un résumé du thème émotionnel central. Rêve : "${dreamText}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: interpretationSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error interpreting dream:', error);
    throw new Error('Failed to interpret dream.');
  }
}

export async function startChatSession(dreamContext: string): Promise<Chat> {
  const systemInstruction = `Vous êtes un assistant d'analyse de rêves. L'utilisateur vient de faire le rêve suivant : "${dreamContext}". Vous allez maintenant l'aider à explorer le symbolisme et la signification de son rêve par la conversation. Soyez perspicace, empathique et appuyez-vous sur des concepts psychologiques, en particulier les archétypes jungiens, lorsque cela est pertinent. Gardez vos réponses conversationnelles et faciles à comprendre. Répondez toujours en français.`;
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
}