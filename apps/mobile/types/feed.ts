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
  productId: string;
  tryOnImageUrl: string | null;
  product: ProductSummary;
}

export interface FeedResponse {
  cards: FeedCard[];
  nextCursor: string | null;
}
