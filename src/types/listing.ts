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
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  searchQuery: string;
}

export interface PriceResult {
  activeListings: number;
  lowestPrice: number;
  averagePrice: number;
  currency: string;
  searchUrl: string;
}

export interface DraftData {
  title: string;
  category: string;
  condition: Condition;
  conditionNotes: string;
  keySpecs: KeySpec[];
  description: string;
  suggestedPrice: number;
}

export type AppStep = 1 | 2 | 3 | 4;
