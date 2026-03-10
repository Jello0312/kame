export interface ProductSummary {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  currency: string;
  platform: string;
  imageUrl: string;
  productPageUrl: string;
}

export interface FeedCard {
  outfitPairingId: string | null;
  tryOnImageUrl: string | null;
  topProduct: ProductSummary | null;
  bottomProduct: ProductSummary | null;
  soloProduct: ProductSummary | null;
  totalPrice: number;
  isSolo: boolean;
}

export interface FeedResponse {
  cards: FeedCard[];
  nextCursor: string | null;
}
