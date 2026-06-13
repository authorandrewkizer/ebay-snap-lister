import { useState } from 'react';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoCapture } from '@/components/PhotoCapture';
import { AnalysisLoader } from '@/components/AnalysisLoader';
import { VoiceNote } from '@/components/VoiceNote';
import { PriceCard } from '@/components/PriceCard';
import { ListingDraft } from '@/components/ListingDraft';
import { cn } from '@/lib/utils';
import type { AppStep, AnalysisResult, PriceResult, ListingDraft as ListingDraftType } from '@/types/listing';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** Fetch with a hard client-side timeout (ms). Throws on timeout. */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('timeout');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const STEP_LABELS: Record<AppStep, string> = {
  1: 'Photo',
  2: 'Analyze',
  3: 'Confirm',
  4: 'Price',
  5: 'Review',
};

function analysisToDefaultDraft(analysis: AnalysisResult): ListingDraftType {
  const suggestedPrice = Math.round(
    ((analysis.suggested_price_low + analysis.suggested_price_high) / 2) * 0.95
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
      {([1, 2, 3, 4, 5] as AppStep[]).map((step) => (
        <div key={step} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'rounded-full transition-all duration-300',
              step === currentStep
                ? 'w-8 h-3 bg-white'
                : step < currentStep
                ? 'w-3 h-3 bg-white opacity-80'
                : 'w-3 h-3 bg-blue-300 opacity-50'
            )}
          />
          <span
            className={cn(
              'text-[9px] font-medium transition-all',
              step === currentStep ? 'text-white' : 'text-blue-200'
            )}
          >
            {STEP_LABELS[step]}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ConfirmationStepProps {
  analysis: AnalysisResult;
  onConfirm: (updated: AnalysisResult) => void;
}

function ConfirmationStep({ analysis, onConfirm }: ConfirmationStepProps) {
  const [itemName, setItemName] = useState(analysis.itemName);
  const [brand, setBrand] = useState(analysis.brand);
  const [model, setModel] = useState(analysis.model);
  const [searchTerms, setSearchTerms] = useState(analysis.search_terms);

  const isLowConfidence = analysis.identification_confidence === 'low';

  function handleConfirm() {
    onConfirm({
      ...analysis,
      itemName,
      brand,
      model,
      search_terms: searchTerms,
    });
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-gray-900">Confirm Item Details</h2>
        <p className="text-sm text-gray-500">
          Review and edit the AI's identification before researching prices
        </p>
      </div>

      {/* Low confidence warning */}
      {isLowConfidence && analysis.missing_info.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠️ Low Confidence — Please fill in missing details:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {analysis.missing_info.map((info, i) => (
              <li key={i}>{info}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable fields */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Item Name</label>
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="rounded-xl min-h-[48px] border-gray-300"
            placeholder="e.g. Vintage Camera"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Brand</label>
          <Input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-xl min-h-[48px] border-gray-300"
            placeholder="e.g. Canon"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Model</label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-xl min-h-[48px] border-gray-300"
            placeholder="e.g. AE-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Search Terms</label>
          <p className="text-xs text-gray-400">Used to find similar listings on eBay</p>
          <Input
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className="rounded-xl min-h-[48px] border-gray-300"
            placeholder="e.g. Canon AE-1 film camera"
          />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full min-h-[56px] rounded-xl text-base font-semibold bg-[#0064D2] hover:bg-blue-700 text-white mt-2"
        onClick={handleConfirm}
      >
        Confirm &amp; Research Price →
      </Button>
    </div>
  );
}

/** Map raw error messages to friendly UI copy. */
function friendlyAnalysisError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === 'timeout') return 'Analysis timed out. Please try again.';
  if (msg.includes('schema') || msg.includes('Zod') || msg.includes('validation')) {
    return 'Could not read item details. Please try again.';
  }
  return 'Analysis failed. Please try again.';
}

export default function App() {
  const [step, setStep] = useState<AppStep>(1);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [voiceNote, setVoiceNote] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [draft, setDraft] = useState<ListingDraftType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>('');

  async function analyzeImage() {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/functions/v1/analyze-item`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ imageBase64, voiceNote: voiceNote || undefined }),
        },
        30_000 // 30s client-side guard (edge fn has its own 25s)
      );

      if (!res.ok) {
        const errText = await res.text();
        // Surface Zod / schema errors with friendly copy
        if (errText.includes('schema') || errText.includes('validation')) {
          throw new Error('schema');
        }
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      setDraft(analysisToDefaultDraft(data));
      setStep(3); // Go to confirmation step
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisError(friendlyAnalysisError(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function fetchPrice(searchTerms: string) {
    setIsFetchingPrice(true);
    try {
      const res = await fetchWithTimeout(
        `${SUPABASE_URL}/functions/v1/get-price`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ search_terms: searchTerms }),
        },
        30_000
      );
      if (!res.ok) {
        // eBay OAuth / server failure — graceful: show AI estimate only, no crash
        console.warn('Price fetch HTTP error:', res.status);
        return;
      }
      const data: PriceResult = await res.json();
      setPriceResult(data);
    } catch (err) {
      // Network / timeout — swallow; PriceCard will show AI estimate fallback
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

  function handleConfirmAndResearch(updatedAnalysis: AnalysisResult) {
    setAnalysisResult(updatedAnalysis);
    setDraft(analysisToDefaultDraft(updatedAnalysis));
    setStep(4);
    fetchPrice(updatedAnalysis.search_terms);
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

        {/* Step 1: Photo capture */}
        {step === 1 && (
          <PhotoCapture onCapture={handleCapture} />
        )}

        {/* Step 2: Voice note + AI analyze */}
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

            {/* Analysis error with retry */}
            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm text-red-700">{analysisError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start gap-2 rounded-xl border-red-300 text-red-600 hover:bg-red-100"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </Button>
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

        {/* Step 3: Confirmation */}
        {step === 3 && analysisResult && (
          <ConfirmationStep
            analysis={analysisResult}
            onConfirm={handleConfirmAndResearch}
          />
        )}

        {/* Step 4: Price research */}
        {step === 4 && analysisResult && (
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
                onClick={() => setStep(5)}
              >
                Review &amp; Edit Listing →
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review draft */}
        {step === 5 && draft && (
          <ListingDraft draft={draft} onChange={setDraft} />
        )}
      </div>
    </div>
  );
}
