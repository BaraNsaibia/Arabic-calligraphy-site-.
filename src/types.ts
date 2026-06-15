export interface Artwork {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  price: number; // in Tunisian Dinar (د.ت)
  image: string;
  category: "luxury" | "geometric" | "lettering";
  size: string;
  limitedEdition: boolean;
  descriptionAr: string;
  descriptionEn: string;
  // Enhanced article fields for premium reading experience
  essayTitleAr?: string;
  essayTitleEn?: string;
  spiritualAr?: string;
  spiritualEn?: string;
  geometricAr?: string;
  geometricEn?: string;
}

export interface CartItem {
  artwork: Artwork;
  quantity: number;
  selectedFrame: "classic_wood" | "museum_gold" | "obsidian_minimal";
}

export interface CommissionRequest {
  name: string;
  email: string;
  phone: string;
  phrase: string;
  notes: string;
  frameType: "classic_wood" | "museum_gold" | "obsidian_minimal";
  size: string;
}

export interface OrderItem {
  artworkId: string;
  titleAr: string;
  titleEn: string;
  image: string;
  quantity: number;
  frameType: "classic_wood" | "museum_gold" | "obsidian_minimal";
  unitPrice: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export type Language = "ar" | "en";

export interface AuthSession {
  name: string;
  email: string;
  isAdmin?: boolean;
}
