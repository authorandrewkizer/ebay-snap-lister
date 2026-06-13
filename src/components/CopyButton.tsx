import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DraftData } from '@/types/listing';

interface CopyButtonProps {
  draft: DraftData;
}

function formatListing(draft: DraftData): string {
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

  async function handleCopy() {
    try {
      const text = formatListing(draft);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
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
  );
}
