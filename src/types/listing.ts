export interface KeySpec {
  key: string;
  value: string;
}

export type Condition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';

export interface AnalysisResult {
  itemName: string;
  brand: string;
  model: string;
  category: string;
  condition: Condition;
  conditionNotes: string;
  keySpecs: KeySpec[];
  suggestedTitle: string;
  description: string;
  suggested_price_low: number;
  suggested_price_high: number;
  price_rationale: string;
  search_terms: string;
  identification_confidence: 'high' | 'medium' | 'low';
  missing_info: string[];
}

export interface PriceResult {
  activeListings: number;
  lowestPrice: number;
  averagePrice: number;
  currency: string;
  searchUrl: string;
  skipped?: boolean;
  reason?: string;
}

/** Single shared draft type — used by the frontend listing editor. */
export interface ListingDraft {
  title: string;
  category: string;
  condition: Condition;
  conditionNotes: string;
  keySpecs: KeySpec[];
  description: string;
  suggestedPrice: number;
}

// Backward-compat alias — prefer ListingDraft in new code.
export type DraftData = ListingDraft;

export type AppStep = 1 | 2 | 3 | 4 | 5;
