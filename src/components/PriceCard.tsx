import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalysisResult, PriceResult } from '@/types/listing';

interface PriceCardProps {
  analysis: AnalysisResult;
  priceResult: PriceResult | null;
  isLoading: boolean;
}

export function PriceCard({ analysis, priceResult, isLoading }: PriceCardProps) {
  const suggestedPrice = Math.round(
    ((analysis.estimatedPriceMin + analysis.estimatedPriceMax) / 2) * 0.95
  );

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      <h2 className="text-xl font-bold text-gray-900">Price Research</h2>
      <p className="text-sm text-gray-500">
        Based on AI analysis and live eBay listings for <strong>{analysis.itemName}</strong>
      </p>

      {/* AI Estimate */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm font-medium text-purple-700 mb-1">🤖 AI Estimate</p>
        <p className="text-2xl font-bold text-purple-900">
          ${analysis.estimatedPriceMin} – ${analysis.estimatedPriceMax}
        </p>
      </div>

      {/* eBay Active Listings */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-700 mb-1">🛒 Active eBay Listings</p>
        {isLoading ? (
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : priceResult ? (
          <>
            <p className="text-2xl font-bold text-blue-900">
              from ${priceResult.lowestPrice.toFixed(2)}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {priceResult.activeListings} listings found · avg ${priceResult.averagePrice.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="text-sm text-blue-500">Could not fetch live prices</p>
        )}
      </div>

      {/* Suggested Listing Price */}
      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
        <p className="text-sm font-medium text-green-700 mb-1">Suggested Listing Price</p>
        <p className="text-4xl font-extrabold text-green-700">${suggestedPrice}</p>
        <p className="text-xs text-green-600 mt-1">Based on AI estimate (5% below midpoint)</p>
      </div>

      {/* eBay Search Link */}
      {priceResult && (
        <Button
          variant="outline"
          className="gap-2 min-h-[48px] rounded-xl border-[#0064D2] text-[#0064D2] hover:bg-blue-50"
          onClick={() => window.open(priceResult.searchUrl, '_blank')}
        >
          See on eBay <ExternalLink className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
