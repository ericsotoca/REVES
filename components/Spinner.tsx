import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Tissage des fils de votre subconscient...",
  "Consultation des archétypes...",
  "Traduction des visions en pixels...",
  "Décodage des symboles de l'éther...",
  "Peinture de votre paysage onirique...",
];

const Spinner: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-400/30 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-indigo-400 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-xl text-indigo-300 transition-opacity duration-500 ease-in-out">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default Spinner;