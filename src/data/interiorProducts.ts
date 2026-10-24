export interface ProductPattern {
  code: string;
  name: string;
  type?: string;
}

export interface InteriorProduct {
  id: string;
  name: string;
  category:
    | 'Wall & Surface'
    | 'Fluted & Decorative'
    | 'Flooring'
    | 'Soffit & Ceilings'
    | 'Roofing & Exterior'
    | 'Partitions & Structural'
    | 'Adhesives & Accessories';
  tagline: string;
  whatIsIt: string;
  whyChooseIt: string[];
  applications: string[];
  image: string;
  specifications: {
    dimensions: string;
    thickness: string;
    coverage: string;
    lifetime: string;
    material: string;
    installation: string;
    boxPieceCount?: string;
  };
  patternsCount: number;
  highlightPatterns: string[];
  matchingAccessories: string[];
  featured?: boolean;
}

export const INTERIOR_CATEGORIES = [
  'All Products',
  'Wall & Surface',
  'Fluted & Decorative',
  'Flooring',
  'Soffit & Ceilings',
  'Roofing & Exterior',
  'Partitions & Structural',
  'Adhesives & Accessories',
] as const;

// All 16 hardcoded product records and their image references removed.
// Products can be loaded separately from Supabase if the website
// is configured to fetch them from there.
export const INTERIOR_PRODUCTS: InteriorProduct[] = [];