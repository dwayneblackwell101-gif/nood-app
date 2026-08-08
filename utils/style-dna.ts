/**
 * Style DNA Types & Constants
 * Core types for the Style DNA personalization system.
 * Opt-in from Settings — never forced at startup.
 */

export type StyleDNACategory =
  | 'colors'
  | 'silhouettes'
  | 'vibes'
  | 'brands'
  | 'categories'
  | 'occasions';

export type StyleDNAProfile = {
  colors: string[];
  silhouettes: string[];
  vibes: string[];
  brands: string[];
  categories: string[];
  occasions: string[];
  primaryVibe: string;
  colorPalette: string[];
  priceSensitivity: 'low' | 'medium' | 'high';
  trendAdoption: 'early' | 'mainstream' | 'late';
  version: number;
  createdAt: string;
  updatedAt: string;
  completedOnboarding: boolean;
};

export const STYLE_DNA_DEFAULTS: StyleDNAProfile = {
  colors: [],
  silhouettes: [],
  vibes: [],
  brands: [],
  categories: [],
  occasions: [],
  primaryVibe: 'minimalist',
  colorPalette: ['#000000', '#FFFFFF', '#FF6A00', '#1A1A2E', '#E8E8E8'],
  priceSensitivity: 'medium',
  trendAdoption: 'mainstream',
  version: 1,
  createdAt: '',
  updatedAt: '',
  completedOnboarding: false,
};

export const ONBOARDING_STEPS = [
  { id: 'colors', label: 'Colors', icon: 'palette-outline', question: 'Which colors speak to you?' },
  { id: 'silhouettes', label: 'Fit & Shape', icon: 'shirt-outline', question: 'How do you like your clothes to fit?' },
  { id: 'vibes', label: 'Your Vibe', icon: 'sparkles-outline', question: "What's your style energy?" },
  { id: 'brands', label: 'Brands', icon: 'diamond-outline', question: 'Which brands do you love?' },
  { id: 'categories', label: 'Categories', icon: 'grid-outline', question: 'What do you shop for most?' },
  { id: 'occasions', label: 'Occasions', icon: 'calendar-outline', question: 'Where are you headed?' },
] as const;

export const STYLE_OPTIONS: Record<StyleDNACategory, Array<{ id: string; label: string; desc?: string; image?: string; color?: string }>> = {
  colors: [
    { id: 'black', label: 'Black', color: '#000000' },
    { id: 'white', label: 'White', color: '#FFFFFF' },
    { id: 'neutral', label: 'Neutrals', color: '#A0A0A0' },
    { id: 'earth', label: 'Earth Tones', color: '#8B7355' },
    { id: 'pastel', label: 'Pastels', color: '#FFB6C1' },
    { id: 'jewel', label: 'Jewel Tones', color: '#4B0082' },
    { id: 'bright', label: 'Bright & Bold', color: '#FF6A00' },
    { id: 'monochrome', label: 'Monochrome', color: '#333333' },
  ],
  silhouettes: [
    { id: 'oversized', label: 'Oversized', desc: 'Relaxed, roomy fit' },
    { id: 'relaxed', label: 'Relaxed', desc: 'Comfortable, easy fit' },
    { id: 'regular', label: 'Regular', desc: 'Classic, true to size' },
    { id: 'fitted', label: 'Fitted', desc: 'Tailored, close to body' },
    { id: 'structured', label: 'Structured', desc: 'Defined shape, holds form' },
    { id: 'cropped', label: 'Cropped', desc: 'Shorter hemlines' },
    { id: 'flowy', label: 'Flowy', desc: 'Movement, drape' },
    { id: 'layered', label: 'Layered', desc: 'Multiple pieces together' },
  ],
  vibes: [
    { id: 'minimalist', label: 'Minimalist', desc: 'Clean, essential, quiet luxury' },
    { id: 'streetwear', label: 'Streetwear', desc: 'Urban, bold, culture-driven' },
    { id: 'bohemian', label: 'Bohemian', desc: 'Free-spirited, eclectic, natural' },
    { id: 'classic', label: 'Classic', desc: 'Timeless, polished, refined' },
    { id: 'edgy', label: 'Edgy', desc: 'Dark, rebellious, statement' },
    { id: 'romantic', label: 'Romantic', desc: 'Soft, feminine, dreamy' },
    { id: 'sporty', label: 'Athleisure', desc: 'Active, functional, cool' },
    { id: 'y2k', label: 'Y2K Revival', desc: 'Nostalgic, playful, metallic' },
  ],
  brands: [
    { id: 'premium', label: 'Designer / Premium', desc: 'High-end, investment pieces' },
    { id: 'contemporary', label: 'Contemporary', desc: 'Modern, accessible luxury' },
    { id: 'streetwear', label: 'Streetwear Brands', desc: 'Supreme, Off-White, etc.' },
    { id: 'sustainable', label: 'Sustainable/Ethical', desc: 'Eco-conscious, transparent' },
    { id: 'indie', label: 'Independent', desc: 'Emerging, unique designers' },
    { id: 'highstreet', label: 'High Street', desc: 'Trendy, affordable, fast' },
    { id: 'vintage', label: 'Vintage/Thrift', desc: 'Pre-loved, one-of-a-kind' },
    { id: 'local', label: 'Local/Artisan', desc: 'Small batch, handmade' },
  ],
  categories: [
    { id: 'tops', label: 'Tops & Tees' },
    { id: 'bottoms', label: 'Pants & Jeans' },
    { id: 'dresses', label: 'Dresses & Jumpsuits' },
    { id: 'outerwear', label: 'Jackets & Coats' },
    { id: 'shoes', label: 'Footwear' },
    { id: 'bags', label: 'Bags & Accessories' },
    { id: 'jewelry', label: 'Jewelry' },
    { id: 'activewear', label: 'Activewear' },
    { id: 'swim', label: 'Swim & Resort' },
    { id: 'beauty', label: 'Beauty & Skincare' },
  ],
  occasions: [
    { id: 'work', label: 'Work / Office' },
    { id: 'casual', label: 'Everyday Casual' },
    { id: 'party', label: 'Night Out / Party' },
    { id: 'date', label: 'Date Night' },
    { id: 'gym', label: 'Gym / Workout' },
    { id: 'travel', label: 'Travel / Vacation' },
    { id: 'wedding', label: 'Wedding / Events' },
    { id: 'lounge', label: 'Lounging / Home' },
    { id: 'festival', label: 'Festival / Concert' },
    { id: 'errands', label: 'Running Errands' },
  ],
};

export function computePrimaryVibe(vibes: string[]): string {
  if (vibes.length === 0) return 'minimalist';
  return vibes[0];
}

export function computeColorPalette(colors: string[]): string[] {
  const paletteMap: Record<string, string[]> = {
    black: ['#000000', '#1A1A1A', '#333333', '#4A4A4A', '#666666'],
    white: ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#DCDCDC', '#C0C0C0'],
    neutral: ['#808080', '#A0A0A0', '#C0C0C0', '#D3D3D3', '#E8E8E8'],
    earth: ['#8B7355', '#A08B6B', '#C4A37E', '#DDB892', '#E8D5B7'],
    pastel: ['#FFB6C1', '#FFDAB9', '#E6E6FA', '#F0FFF0', '#FFF0F5'],
    jewel: ['#4B0082', '#800080', '#8A2BE2', '#9932CC', '#BA55D3'],
    bright: ['#FF6A00', '#FF4500', '#FFD700', '#00FF7F', '#00BFFF'],
    monochrome: ['#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666'],
  };

  const selectedColors = colors.flatMap(c => paletteMap[c] || []);
  const unique = [...new Set(selectedColors)];
  return unique.slice(0, 5).length >= 5 ? unique.slice(0, 5) :
    [...unique, ...['#FF6A00', '#1A1A2E', '#E8E8E8']].slice(0, 5);
}

export function computePriceSensitivity(
  brands: string[],
  priceRange?: { min: number; max: number }
): 'low' | 'medium' | 'high' {
  const premiumBrands = ['premium', 'designer', 'luxury'];
  const budgetBrands = ['highstreet', 'fast', 'budget'];

  const hasPremium = brands.some(b => premiumBrands.some(p => b.includes(p)));
  const hasBudget = brands.some(b => budgetBrands.some(p => b.includes(p)));

  if (hasPremium && !hasBudget) return 'low';
  if (hasBudget && !hasPremium) return 'high';
  return 'medium';
}

export function computeTrendAdoption(vibes: string[], brands: string[]): 'early' | 'mainstream' | 'late' {
  const earlyVibes = ['streetwear', 'y2k', 'edgy'];
  const earlyBrands = ['streetwear', 'indie', 'emerging'];

  const hasEarlyVibe = vibes.some(v => earlyVibes.includes(v));
  const hasEarlyBrand = brands.some(b => earlyBrands.includes(b));

  if (hasEarlyVibe || hasEarlyBrand) return 'early';
  if (vibes.includes('classic') || brands.includes('premium')) return 'late';
  return 'mainstream';
}
