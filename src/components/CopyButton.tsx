import { useState } from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ListingDraft } from '@/types/listing';

interface CopyButtonProps {
  draft: ListingDraft;
}

function formatListing(draft: ListingDraft): string {
  const specs = draft.keySpecs.map((s) => `${s.key}: ${s.value}`).join('\n');
  return [
    `TITLE: ${draft.title}`,
    `CATEGORY: ${draft.category}`,
    `CONDITION: ${draft.condition}`,
    `CONDITION NOTES: ${draft.conditionNotes}`,
    '',
    'DESCRIPTION:',
    draft.description,
    '',
    'ITEM SPECIFICS:',
    specs,
    '',
    `SUGGESTED PRICE: $${draft.suggestedPrice}`,
  ].join('\n');
}

export function CopyButton({ draft }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    setCopyError(false);
    try {
      const text = formatListing(draft);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full gap-2 min-h-[56px] rounded-xl text-base font-semibold bg-[#0064D2] hover:bg-blue-700 text-white"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            Copy Full Listing
          </>
        )}
      </Button>

      {copyError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            Could not copy. Please select and copy manually.
          </p>
        </div>
      )}
    </div>
  );
}
