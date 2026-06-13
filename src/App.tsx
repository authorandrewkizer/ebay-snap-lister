import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoCapture } from '@/components/PhotoCapture';
import { AnalysisLoader } from '@/components/AnalysisLoader';
import { VoiceNote } from '@/components/VoiceNote';
import { PriceCard } from '@/components/PriceCard';
import { ListingDraft } from '@/components/ListingDraft';
import { cn } from '@/lib/utils';
import type { AppStep, AnalysisResult, PriceResult, DraftData } from '@/types/listing';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

function analysisToDefaultDraft(analysis: AnalysisResult): DraftData {
  const suggestedPrice = Math.round(
    ((analysis.estimatedPriceMin + analysis.estimatedPriceMax) / 2) * 0.95
  );
  return {
    title: analysis.suggestedTitle,
    category: analysis.category,
    condition: analysis.condition,
    conditionNotes: analysis.conditionNotes,
    keySpecs: analysis.keySpecs,
    description: analysis.description,
    suggestedPrice,
  };
}

function StepIndicator({ currentStep }: { currentStep: AppStep }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {([1, 2, 3, 4] as AppStep[]).map((step) => (
        <div
          key={step}
          className={cn(
            'rounded-full transition-all duration-300',
            step === currentStep
              ? 'w-8 h-3 bg-[#0064D2]'
              : step < currentStep
              ? 'w-3 h-3 bg-[#0064D2]'
              : 'w-3 h-3 bg-gray-200'
          )}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<AppStep>(1);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [voiceNote, setVoiceNote] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>('');

  // Auto-trigger price research when step 3 is reached
  useEffect(() => {
    if (step === 3 && analysisResult && !priceResult && !isFetchingPrice) {
      fetchPrice(analysisResult.searchQuery);
    }
  }, [step, analysisResult]);

  async function analyzeImage() {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ imageBase64, voiceNote: voiceNote || undefined }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      setDraft(analysisToDefaultDraft(data));
      setStep(3);
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function fetchPrice(searchQuery: string) {
    setIsFetchingPrice(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ searchQuery }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PriceResult = await res.json();
      setPriceResult(data);
    } catch (err) {
      console.error('Price fetch failed:', err);
    } finally {
      setIsFetchingPrice(false);
    }
  }

  function handleCapture(base64: string) {
    setImageBase64(base64);
    setStep(2);
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as AppStep);
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-[#0064D2] text-white px-4 pt-safe-top">
        <div className="flex items-center h-14">
          {step > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-700 -ml-2 mr-2"
              onClick={handleBack}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <h1 className="font-bold text-lg tracking-tight">
            📦 eBay Snap Lister
          </h1>
        </div>
        <StepIndicator currentStep={step} />
      </div>

      {/* Content */}
      <div className="relative">
        {isAnalyzing && <AnalysisLoader />}

        {step === 1 && (
          <PhotoCapture onCapture={handleCapture} />
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 px-6 py-6">
            {/* Image preview */}
            {imageBase64 && (
              <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                <img
                  src={`data:image/jpeg;base64,${imageBase64}`}
                  alt="Captured item"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-gray-900">Add Details</h2>
              <p className="text-sm text-gray-500">
                Optionally add a voice note with extra details about your item
              </p>
            </div>

            <VoiceNote
              onTranscript={setVoiceNote}
              transcript={voiceNote}
            />

            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {analysisError}
              </div>
            )}

            <Button
              size="lg"
              className="w-full min-h-[56px] rounded-xl text-base font-semibold bg-[#0064D2] hover:bg-blue-700 text-white"
              onClick={analyzeImage}
              disabled={!imageBase64 || isAnalyzing}
            >
              Analyze with AI →
            </Button>
          </div>
        )}

        {step === 3 && analysisResult && (
          <div className="flex flex-col">
            <PriceCard
              analysis={analysisResult}
              priceResult={priceResult}
              isLoading={isFetchingPrice}
            />
            <div className="px-6 pb-8">
              <Button
                size="lg"
                className="w-full min-h-[56px] rounded-xl text-base font-semibold bg-[#0064D2] hover:bg-blue-700 text-white"
                onClick={() => setStep(4)}
              >
                Review & Edit Listing →
              </Button>
            </div>
          </div>
        )}

        {step === 4 && draft && (
          <ListingDraft draft={draft} onChange={setDraft} />
        )}
      </div>
    </div>
  );
}
