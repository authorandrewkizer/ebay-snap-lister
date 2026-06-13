import { useEffect, useState } from 'react';

const MESSAGES = [
  'Identifying item...',
  'Checking condition...',
  'Writing description...',
  'Estimating value...',
  'Almost done...',
];

export function AnalysisLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-4 border-[#0064D2] border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p
          key={messageIndex}
          className="text-lg font-medium text-gray-700 animate-pulse"
        >
          {MESSAGES[messageIndex]}
        </p>
        <p className="text-sm text-gray-400 mt-1">AI is analyzing your item</p>
      </div>
    </div>
  );
}
