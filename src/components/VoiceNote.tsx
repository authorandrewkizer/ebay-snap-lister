import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceNoteProps {
  onTranscript: (text: string) => void;
  transcript: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getSpeechRecognition(): AnyRecognition | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceNote({ onTranscript, transcript }: VoiceNoteProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => getSpeechRecognition() !== null);
  const recognitionRef = useRef<AnyRecognition>(null);

  function startListening() {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscript(transcript ? transcript + ' ' + finalTranscript : finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 rounded-xl p-4">
        <MicOff className="w-4 h-4" />
        <span>Voice not supported on this browser</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="lg"
        className={cn(
          'gap-2 min-h-[48px] rounded-xl px-6 font-medium',
          isListening && 'bg-[#E53238] hover:bg-red-600 border-[#E53238]'
        )}
        onClick={isListening ? stopListening : startListening}
      >
        <span
          className={cn(
            'w-3 h-3 rounded-full',
            isListening ? 'bg-white animate-pulse' : 'bg-gray-400'
          )}
        />
        <Mic className="w-5 h-5" />
        {isListening ? 'Listening... (tap to stop)' : 'Add Voice Note'}
      </Button>

      {transcript && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm font-medium text-blue-700 mb-1">Voice note:</p>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}
    </div>
  );
}
