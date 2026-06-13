import { useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CopyButton } from '@/components/CopyButton';
import type { DraftData, Condition, KeySpec } from '@/types/listing';

interface ListingDraftProps {
  draft: DraftData;
  onChange: (draft: DraftData) => void;
}

const CONDITIONS: Condition[] = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

function FieldCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export function ListingDraft({ draft, onChange }: ListingDraftProps) {
  function update<K extends keyof DraftData>(key: K, value: DraftData[K]) {
    onChange({ ...draft, [key]: value });
  }

  function updateSpec(index: number, field: keyof KeySpec, value: string) {
    const updated = draft.keySpecs.map((spec, i) =>
      i === index ? { ...spec, [field]: value } : spec
    );
    update('keySpecs', updated);
  }

  function addSpec() {
    update('keySpecs', [...draft.keySpecs, { key: '', value: '' }]);
  }

  function removeSpec(index: number) {
    update('keySpecs', draft.keySpecs.filter((_, i) => i !== index));
  }

  const titleLength = draft.title.length;

  return (
    <div className="flex flex-col gap-5 px-6 py-4 pb-8">
      <h2 className="text-xl font-bold text-gray-900">Review Your Listing</h2>
      <p className="text-sm text-gray-500">Edit any field before copying to eBay</p>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <span className={`text-xs ${titleLength > 80 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {titleLength}/80
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            value={draft.title}
            onChange={(e) => update('title', e.target.value)}
            className={`rounded-xl min-h-[48px] border-gray-300 flex-1 ${titleLength > 80 ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="eBay listing title"
          />
          <FieldCopyButton value={draft.title} />
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <Input
          value={draft.category}
          onChange={(e) => update('category', e.target.value)}
          className="rounded-xl min-h-[48px] border-gray-300"
          placeholder="e.g. Cameras & Photo"
        />
      </div>

      {/* Condition */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Condition</label>
        <Select
          value={draft.condition}
          onValueChange={(val) => update('condition', val as Condition)}
        >
          <SelectTrigger className="rounded-xl min-h-[48px] border-gray-300">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Condition Notes</label>
        <div className="flex items-start gap-1.5">
          <Textarea
            value={draft.conditionNotes}
            onChange={(e) => update('conditionNotes', e.target.value)}
            className="rounded-xl border-gray-300 flex-1"
            rows={2}
            placeholder="Describe any wear, scratches, or notable condition details"
          />
          <FieldCopyButton value={draft.conditionNotes} />
        </div>
      </div>

      {/* Key Specs */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Item Specifics</label>
        {draft.keySpecs.map((spec, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={spec.key}
              onChange={(e) => updateSpec(i, 'key', e.target.value)}
              className="rounded-xl border-gray-300 min-h-[44px]"
              placeholder="e.g. Brand"
            />
            <Input
              value={spec.value}
              onChange={(e) => updateSpec(i, 'value', e.target.value)}
              className="rounded-xl border-gray-300 min-h-[44px]"
              placeholder="e.g. Sony"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
              onClick={() => removeSpec(i)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start rounded-xl border-dashed border-gray-300 text-gray-500"
          onClick={addSpec}
        >
          <Plus className="w-4 h-4" />
          Add Spec
        </Button>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <div className="flex items-start gap-1.5">
          <Textarea
            value={draft.description}
            onChange={(e) => update('description', e.target.value)}
            className="rounded-xl border-gray-300 flex-1"
            rows={4}
            placeholder="Item description for buyers"
          />
          <FieldCopyButton value={draft.description} />
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Suggested Price ($)</label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={draft.suggestedPrice}
            onChange={(e) => update('suggestedPrice', Number(e.target.value))}
            className="rounded-xl min-h-[48px] border-gray-300 text-xl font-bold flex-1"
            min={0}
            step={0.01}
          />
          <FieldCopyButton value={String(draft.suggestedPrice)} />
        </div>
      </div>

      {/* Copy Full Listing */}
      <CopyButton draft={draft} />

      {/* Photo transfer note */}
      <p className="text-xs text-gray-500 text-center">
        📷 Note: Photos are not transferred — upload your photos to eBay separately.
      </p>
    </div>
  );
}
