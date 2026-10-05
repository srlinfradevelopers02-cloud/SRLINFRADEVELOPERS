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

export const INTERIOR_PRODUCTS: InteriorProduct[] = [
  // 1. polygranite sheet
  {
    id: 'polygranite-sheets',
    name: 'Polygranite Sheet',
    category: 'Wall & Surface',
    tagline: 'High-density architectural marble & granite composite sheets for luxury walls.',
    whatIsIt:
      'Polygranite Sheets are engineered from PVC and Calcium Carbonate to flawlessly mimic natural granite and Italian marble. They offer high-definition veins, mirror-gloss and matte surfaces with zero masonry hassle.',
    whyChooseIt: [
      '100% Water Resistant & Moisture Proof',
      'Termite Resistant & Fire Resistant core',
      '20-25 Years expected lifespan with proper care',
      'Cost-effective alternative to heavy natural marble slabs',
      'Easy to clean with a damp microfiber cloth',
      'Swift installation using specialized adhesive with minimal prep',
    ],
    applications: [
      'Living Room TV Accent Walls',
      'Hotel Lobbies & Hallways',
      'Executive Corporate Boardrooms',
      'Restaurant & Cafe Interiors',
      'Theatres & Club Lounges',
      'Elevator Cladding & Foyers',
    ],
    // 1. Polygranite Sheet
    image: '/products/Luxury Polygranite Kitchen.png',
    specifications: {
      dimensions: '4 Feet Width x 8 Feet Height',
      thickness: '3mm & 1.2mm',
      coverage: '32 Sq. Ft per sheet',
      lifetime: '20-25 Years',
      material: 'PVC and Calcium Carbonate composite',
      installation: 'Direct surface adhesion with BondX adhesive & aluminium trims',
      boxPieceCount: 'Available in individual sheets or bulk packs',
    },
    patternsCount: 51,
    highlightPatterns: [
      'PG01 Italian Black',
      'PG02 Italian White',
      'PG03 Indus Gold',
      'PG04 Fonce Imperial',
      'PG05 Rainforest Gold',
      'PG12 Lavadia Black Marble',
      'PG20 Statuario Granite',
      'PGG01 Golden Harvest (Glitter)',
      'PGG04 Golden Vein (Glitter)',
      'PGG05 Gold Calacatta (Glitter)',
      'PGG09 Gilded Blue Rose (Glitter)',
      'PC01 Solid White (1.2mm)',
    ],
    matchingAccessories: [
      'PVC Border (2", 4", 8" Width x 10ft Height)',
      'PVC Internal Corner (10ft)',
      'PVC L Corner (10ft)',
      'Aluminium Edge Strip, Flat Strip, I Strip (Rose Gold, 10ft)',
    ],
    featured: true,
  },

  // 2. stone panels
  {
    id: 'stone-panels',
    name: 'Stone Panels',
    category: 'Wall & Surface',
    tagline: 'Deep textured composite stone cladding engineered for 30+ year longevity.',
    whatIsIt:
      'Durable cladding solutions crafted from PVC and calcium carbonate composite stone, offering both high visual depth and tangible physical stone texture. Designed for premium feature walls and interior architectural facades.',
    whyChooseIt: [
      'Lasts over 30 years with proper installation & care',
      'Delivers both visual and physical tactile stone texture',
      'Fire-resistant, water-resistant & termite-proof',
      'Provides thermal insulation and structural beauty',
      'Requires minimal ongoing maintenance compared to real stone',
    ],
    applications: [
      'Grand Living Room Walls',
      'Hospitality Receptions & Lobbies',
      'Feature Backdrops & Niches',
      'Commercial Atriums & Corridors',
      'Dining Room Backsplashes',
    ],
    image: '/products/PU Stone Panels.png',
    specifications: {
      dimensions: '4 Feet Width x 8 Feet Height',
      thickness: '3mm',
      coverage: '32 Sq. Ft per panel',
      lifetime: '30+ Years',
      material: 'PVC & Calcium Carbonate with 3D Textured Finish',
      installation: 'Fixed with structural adhesives & aluminium profile trims',
    },
    patternsCount: 10,
    highlightPatterns: [
      'SP01 Bronze Armani',
      'SP02 Antique Gris',
      'SP03 Wave Gold',
      'SP04 Platinum White',
      'SP05 Metallic Grey',
      'SP06 Crust Winter',
      'SP07 Viscon White',
      'SP08 Eternal Silestone',
      'SP09 Lava Graphite',
      'SP10 Grooved Statuario',
    ],
    matchingAccessories: [
      'Aluminium Edge Strip (Rose Gold & Gold, 8ft)',
      'Aluminium Flat Strip & I Strip (8ft)',
      'Aluminium Internal & External Corner (8ft)',
      'Aluminium L Corner (8ft)',
    ],
    featured: true,
  },

  // 3. WPC Interior Fluted Panels
  {
    id: 'wpc-interior-fluted-panels',
    name: 'WPC Interior Fluted Panels',
    category: 'Fluted & Decorative',
    tagline: 'Modern 3D acoustic fluted slat cladding in 6 distinct architectural profile models.',
    whatIsIt:
      'Wood-Plastic Composite interior fluted panels combining wood fibres, polymers, and UV stabilizers. Known for their acoustic softening, vertical shadow lines, and warm timber ambience across 6 profile models.',
    whyChooseIt: [
      '6 engineered architectural models (8mm, 12mm, 17mm, 18mm, 24mm, 28mm depth)',
      'Natural wood look without warping, cracking, or splintering',
      '20 years durability with high moisture and termite resistance',
      'Easy to cut, screw, nail, and install with standard tools and adhesive',
      'Lightweight and easy to clean with dry or damp cloth',
    ],
    applications: [
      'Staircase Feature Walls',
      'Headboard Paneling in Master Suites',
      'Conference Rooms & Acoustic Pods',
      'Living Room Partitions & TV Consoles',
      'Retail Boutique Accent Walls',
    ],
    image: '/products/Modern WPC Interior Fluted Panel.png',
    specifications: {
      dimensions: 'Height: 9 Feet 6 Inch | Widths: 5.9" to 8" (depending on model)',
      thickness: '8mm, 12mm, 17mm, 18mm, 24mm, 28mm',
      coverage: '4.6 to 6.3 Sq. Ft per piece',
      lifetime: '20 Years',
      material: 'Wood Fibre, Polymer, Additives, Pigments & UV Stabilizers',
      installation: 'Tongue-and-groove interlock, glued and nailed to substrate',
      boxPieceCount: '12 to 18 pieces per box depending on model',
    },
    patternsCount: 32,
    highlightPatterns: [
      'Model 1 (24mm): 4001 Jade Black, 4004 Colonial Maple, 4005 Jacobean Wood',
      'Model 2 (28mm): 3001 Platinum Grey, 3005 White Oak, 3006 Statuario White',
      'Model 3 (12mm): 3001A Scotch Mist, 3002A Silver Charcoal, 3003A African Teak',
      'Model 4 (18mm): 4001A Carnel Beige, 4003A Cedar Pine, 4005A Royal Mahogany',
      'Model 5 (8mm): 6001 Oak White, 6003 Polar White, 6004 Sea Green',
      'Model 6 (17mm): 8001 Soft Ivory, 8002 Friso Dark, 8003 Turkey Wood',
    ],
    matchingAccessories: [
      'WPC L Corner Trims (10 Feet Length | 100 Pieces per box)',
      'End Caps & Matching Transition Strips',
    ],
    featured: true,
  },

  // 4. WPC Exterior Fluted Panels
  {
    id: 'wpc-exterior-fluted-panels',
    name: 'WPC Exterior Fluted Panels',
    category: 'Fluted & Decorative',
    tagline: 'Weatherproof UV-stabilized exterior vertical facade panels for architectural elevations.',
    whatIsIt:
      'Engineered specifically for outdoor facades, balconies, patio ceilings, and commercial shopfronts. Designed to withstand scorching sun, driving rain, and temperature shifts without fading or warping.',
    whyChooseIt: [
      '25-30 years lifespan with minimal maintenance',
      'Heavy-duty 26mm thickness with deep vertical fluting',
      'Protection against UV rays, moisture, mould, and pests',
      'Installed with hidden fasteners and clips for seamless screw-free look',
      'Eco-friendly composite wood finish that never requires repainting',
    ],
    applications: [
      'Modern Villa Elevation Facades',
      'Cafe & Restaurant Shopfronts',
      'Balcony & Terrace Accent Cladding',
      'Commercial Building Entrance Portals',
      'Outdoor Landscaping & Boundary Walls',
    ],
    image: '/products/Modern WPC Exterior Fluted Panel.png',
    specifications: {
      dimensions: 'Width: 8.7 Inch | Height: 9 Feet 6 Inch',
      thickness: '26mm',
      coverage: '6.84 Sq. Ft per panel (5 pieces per box)',
      lifetime: '25-30 Years',
      material: 'Exterior-grade Wood Plastic Composite with UV inhibitors',
      installation: 'Concealed stainless steel clips and framing sub-structure',
      boxPieceCount: '5 Pieces per box',
    },
    patternsCount: 4,
    highlightPatterns: [
      'EW01 Green Heart Wood',
      'EW02 Metal Grey Wood',
      'EW03 Ebony Brown Wood',
      'EW04 Oxford Brown Wood',
    ],
    matchingAccessories: [
      'WPC Exterior L Corners in matching pattern colours',
      'Stainless Steel Hidden Fasteners and Clips',
    ],
    featured: true,
  },

  // 5. SPC Flooring
  {
    id: 'spc-flooring',
    name: 'SPC Flooring',
    category: 'Flooring',
    tagline: '100% waterproof rigid core flooring with integrated 1.5mm acoustic IXPE pad.',
    whatIsIt:
      'Rigid core flooring engineered from natural limestone powder, virgin polymer, and stabilizers. Features a built-in 1.5mm sound-dampening IXPE acoustic underlayment and precision German click-lock mechanism.',
    whyChooseIt: [
      '100% Waterproof — ideal for kitchens, basements, and dining areas',
      'Integrated 1.5mm IXPE pad softens footsteps and reduces noise',
      'Click-lock installation without messy glue, nails, or grout',
      'Heavy wear layer resists scratches, pet claws, high heels, and stains',
      '20 years warranty life with zero swelling or expansion issues',
    ],
    applications: [
      'Luxury Residential Living & Bedrooms',
      'High-Traffic Commercial Offices',
      'Restaurants & Banquet Dining Spaces',
      'Showrooms & Boutiques',
      'Clinics, Wellness Centers & Gyms',
    ],
    image: '/products/Luxury SPC Flooring.png',
    specifications: {
      dimensions: 'Width: 7 Inch | Height: 4 Feet (1220mm x 180mm)',
      thickness: '6.5mm (5mm rigid SPC stone core + 1.5mm IXPE pad)',
      coverage: '2.36 Sq. Ft per piece (Box: 8 pieces / 18.88 Sq. Ft)',
      lifetime: '20 Years',
      material: 'Limestone Powder, Virgin PVC & IXPE Foam Backing',
      installation: 'Unilin click-lock floating floor over existing flat substrate',
      boxPieceCount: '8 Pieces per box (18.88 Sq. Ft)',
    },
    patternsCount: 6,
    highlightPatterns: [
      'BBF01 Chic Walnut',
      'BBF02 Dark Sen',
      'BBF03 Thermo Pine',
      'BBF04 Moon Light Oak',
      'BBF05 Exotic Beige',
      'BBF06 Ridged Brazilian',
    ],
    matchingAccessories: [
      'Matching SPC Stairnose (8ft Length, 10 pcs/box)',
      'Matching Skirting Line Baseboard (8ft Length, 10 pcs/box)',
      'T-Shaped Moulding for door transitions (8ft Length, 20 pcs/box)',
      'Reducer Profile for level changes (8ft Length, 20 pcs/box)',
    ],
    featured: true,
  },

  // 6. Soffit Panels
  {
    id: 'soffit-panels',
    name: 'Soffit Panels',
    category: 'Soffit & Ceilings',
    tagline: 'Maintenance-free ceiling & eave cladding designed for 20-40 year outdoor exposure.',
    whatIsIt:
      'Soffit Panels cover the underside of eaves, roof overhangs, porches, and balconies. They combine warm woodgrain aesthetics with ventilation, rafter protection, and pest defense.',
    whyChooseIt: [
      'Lasts 20-40 years depending on environmental conditions',
      'Resistant to rot, insects, termites, and airborne moisture',
      'Provides clean ventilation to attic and ceiling spaces',
      'Lightweight and easily installed with aluminium channels',
      'Seamless interlocking profile hides all fasteners',
    ],
    applications: [
      'Porch & Patio Ceilings',
      'Balcony Overhangs & Soffits',
      'Roof Eaves & Facia Undersides',
      'Resort Semi-Open Corridors',
      'Modern Villa Carports',
    ],
    image: '/products/Modern Soffit Panels Brochure.png',
    specifications: {
      dimensions: 'Width: 1 Feet | Height: 12 Feet',
      thickness: '1mm',
      coverage: '12 Sq. Ft per piece (Box: 12 pieces / 144 Sq. Ft)',
      lifetime: '20-40 Years',
      material: 'PVC with Embossed Wood Texture / Wooden Designs',
      installation: 'Aluminium channels (H-channel, J-channel) and fasteners',
      boxPieceCount: '12 Pieces per box',
    },
    patternsCount: 9,
    highlightPatterns: [
      'SW001 Early American',
      'SW002 Teak Wood',
      'SW003 Light Oak',
      'SW004 Walnut Brown',
      'SW005 Jacobean Wood',
      'SW006 Graphite',
      'SW007 Solid White',
      'SW008 Western Brown',
      'SW009 Oriental White Oak',
    ],
    matchingAccessories: [
      'H-Channel (12ft, 24 pcs/box)',
      'J-Channel (12ft, 40 pcs/box)',
      'Inner Corner & Outer Corner (12ft, 10 pcs/box)',
    ],
    featured: false,
  },

  // 7. soffit fluted panels
  {
    id: 'soffit-fluted-panels',
    name: 'Soffit Fluted Panels',
    category: 'Soffit & Ceilings',
    tagline: 'Architectural fluted ceiling slats for modern porch and balcony elevations.',
    whatIsIt:
      'Specialized 6-inch fluted exterior ceiling cladding manufactured from 97% virgin PVC raw material. Provides a sleek, linear timber ceiling texture while protecting building rafters from moisture, heat, and pests.',
    whyChooseIt: [
      '15 years lifespan with weather-resistant PVC formulation',
      'Modern fluted texture that elevates porch and balcony ceilings',
      'Anti-bacterial, water-resistant, and fire-resistant',
      'Easy to install with clips or screws on basic wood or steel framing',
      'Ultra lightweight with seamless shadow gaps',
    ],
    applications: [
      'Villa Entrance Canopies',
      'Covered Balconies & Terraces',
      'Resort Gazebos & Lounges',
      'Transitional Indoor-Outdoor Foyers',
    ],
    image: '/products/Premium Soffit Fluted Panels.png',
    specifications: {
      dimensions: 'Width: 6 Inch | Height: 9.5 Feet',
      thickness: '1mm',
      coverage: '4.75 Sq. Ft per piece (Box: 12 pieces)',
      lifetime: '15 Years',
      material: '97% Virgin PVC Raw Material',
      installation: 'Clips or screws on basic ceiling framing',
      boxPieceCount: '12 Pieces per box',
    },
    patternsCount: 6,
    highlightPatterns: [
      'VSF001 Caramel Timber',
      'VSF002 Wheat Oak',
      'VSF003 Ribbed-Wood',
      'VSF004 Sunset-Cherry',
      'VSF005 Deep Chestnut',
      'VSF006 Smokey Walnut',
    ],
    matchingAccessories: [
      'H-Channel & J-Channel (12ft)',
      'Inner Corner & Outer Corner Trims',
    ],
    featured: false,
  },

  // 8. soffit exterior panels
  {
    id: 'soffit-exterior-panels',
    name: 'Soffit Exterior Panels',
    category: 'Soffit & Ceilings',
    tagline: 'Wide 1-foot interlocking exterior soffit planks for grand villa elevations.',
    whatIsIt:
      'High-grade, weather-resistant exterior panels precision-milled for extreme climatic durability. Endures direct UV exposure, moisture, and temperature fluctuations without warping or fading.',
    whyChooseIt: [
      'Wide 1-foot plank profile covers large areas quickly',
      'Advanced interlocking system ensures structural integrity',
      'Resistant to coastal moisture, rot, and termites',
      '15 years maintenance-free lifespan',
    ],
    applications: [
      'Grand Villa Porticos & Driveway Porches',
      'High-End Resort Elevation Ceilings',
      'Commercial Showroom Overhangs',
    ],
    image: '/products/Modern Soffit Exterior Panels.png',
    specifications: {
      dimensions: 'Width: 1 Feet | Height: 12 Feet',
      thickness: '1mm',
      coverage: '12 Sq. Ft per piece (Box: 12 pieces / 144 Sq. Ft)',
      lifetime: '15 Years',
      material: '97% PVC Raw Material with Weather Resins',
      installation: 'Basic framing with H-Channel & J-Channel accessories',
      boxPieceCount: '12 Pieces per box',
    },
    patternsCount: 4,
    highlightPatterns: [
      'VSE001 Honey Oak',
      'VSE002 Cinnamon Maple',
      'VSE003 Coco Teak',
      'VSE004 Spiced Walnut',
    ],
    matchingAccessories: [
      'H-Channel (12ft, 24 pcs/box)',
      'J-Channel (12ft, 40 pcs/box)',
    ],
    featured: false,
  },

  // 9. PU stone panels
  {
    id: 'pu-stone-panels',
    name: 'PU Stone Panels',
    category: 'Wall & Surface',
    tagline: 'Ultra-lightweight high-density polyurethane 3D stone replica panels.',
    whatIsIt:
      'Cutting-edge polyurethane (PU) building panels that replicate the rugged beauty and texture of stacked natural stone, volcanic rock, and geometric reliefs at a fraction of the weight.',
    whyChooseIt: [
      'Extremely lightweight — can be installed on drywall without reinforcing walls',
      'Available in 30mm and 50mm deep relief profiles',
      'Built-in thermal insulation and acoustic dampening properties',
      'Waterproof, anti-corrosion, anti-insect, and fire-resistant',
      '20-30 years life; installed rapidly with silicon glue and screws',
    ],
    applications: [
      'Fireplace Surrounds & Feature Niches',
      'Hotel & Restaurant Reception Backdrops',
      'Villa Living Room Accent Pillars',
      'Wine Cellars & Basement Lounges',
      'Commercial Showrooms',
    ],
    image: '/products/PU Stone Panels.png',
    specifications: {
      dimensions: 'Width: 2 Feet x Height: 4 Feet (600mm x 1200mm)',
      thickness: '30mm & 50mm deep relief',
      coverage: '8 Sq. Ft per panel',
      lifetime: '20-30 Years',
      material: 'High-Density Structural Polyurethane (PU)',
      installation: 'Silicon adhesive, screws, and concealed interlocking edges',
    },
    patternsCount: 8,
    highlightPatterns: [
      '50mm Model(M): PU01 Pure Black, PU02 Elegant Black, PU03 Volcanic Grey',
      '30mm Model(J): PU04 White Hump, PU05 Earthy Hump',
      '30mm Model(B1): PU06 Half Disk',
      '30mm Model(JLZ): PU07 Twin Moon',
      '30mm Model(W1): PU08 Vertical Terracotta',
    ],
    matchingAccessories: [
      'Structural Silicon Glue',
      'Concealed Screws & Fasteners',
      'Touch-up Stone Paste for seams',
    ],
    featured: true,
  },

  // 10. Bamboo charcoal board
  {
    id: 'bamboo-charcoal-board',
    name: 'Bamboo Charcoal Board',
    category: 'Wall & Surface',
    tagline: 'Eco-friendly carbonized bamboo fibre solid board with textile and linen textures.',
    whatIsIt:
      'A revolutionary eco-friendly interior board crafted from carbonized sustainable bamboo fibre, stone powder, and multi-layer film finishes. Naturally neutralizes indoor odours and humidity.',
    whyChooseIt: [
      'Eco-friendly carbonized bamboo core with anti-bacterial and non-toxic properties',
      'Waterproof, fire-proof, moisture-proof, and heat insulating',
      'Luxurious textile, woven linen, and metallic surface finishes',
      '8mm solid thickness allows slotting, v-groove bending, and curving',
      '20 years warranty life with zero formaldehyde emissions',
    ],
    applications: [
      'Luxury Master Bedroom Wall Linings',
      'Corporate Executive Offices',
      'Walk-In Wardrobes & Cabinetry Cladding',
      'Curved Wall Architectural Features',
      'Fine Dining Accent Walls',
    ],
    image: '/products/Bamboo Charcoal Boards.png',
    specifications: {
      dimensions: 'Width: 4 Feet | Height: 8 Feet',
      thickness: '8mm solid core',
      coverage: '32 Sq. Ft per sheet',
      lifetime: '20 Years',
      material: 'Bamboo Fibre Solid Board, PET, PU, Stone Powder & PVC Film',
      installation: 'Aluminium channel profiles (H-Profile, Edge Profile) and adhesive',
    },
    patternsCount: 9,
    highlightPatterns: [
      'BCB01 Grey Irish',
      'BCB02 Green Linen',
      'BCB03 Matty Brown',
      'BCB04 Prestige White',
      'BCB05 Spandex White',
      'BCB06 Silver Horizon',
      'BCB07 Brown Tussar',
      'BCB08 Cotton Blend',
      'BCB09 Cream Diamond',
    ],
    matchingAccessories: [
      'Aluminium H-Profile (10ft)',
      'Aluminium Mid-Profile (10ft)',
      'Aluminium External Profile & Edge Profile (10ft)',
      'Collor Profile Trims (10ft)',
    ],
    featured: true,
  },

  // 11. Wallpapers
  {
    id: 'wallpapers',
    name: 'Wallpapers',
    category: 'Wall & Surface',
    tagline: 'Premium 210 GSM non-woven wallpapers in 57 artistic and metallic patterns.',
    whatIsIt:
      'Heavyweight 210 GSM non-woven paper wallpapers designed to add warmth, tactile texture, and visual interest to interior rooms. Breathable, durable, and washable.',
    whyChooseIt: [
      '57 distinct curated patterns across geometric, botanical, and metallic textures',
      'Heavy 210 GSM construction covers minor wall imperfections seamlessly',
      '5-15 years lifespan with easy cleaning using damp cloth',
      'Breathable non-woven material prevents mildew under humidity',
    ],
    applications: [
      'Feature Accent Walls in Bedrooms & Living Rooms',
      'Luxury Powder Rooms',
      'Boutique Hotel Guest Rooms',
      'Dining Room Alcoves',
    ],
    image: '/products/Premium Wallpaper Design.png',
    specifications: {
      dimensions: 'Width: 1 Feet 9 Inch (21 inches) | Height: 32 Feet per roll',
      thickness: '210 GSM Heavyweight Paper',
      coverage: '56 Sq. Ft per roll (Box: 20 rolls)',
      lifetime: '5-15 Years',
      material: 'Non-woven paper with metallic & tactile embossed finishes',
      installation: 'Applied using specialized wallpaper paste or adhesive',
    },
    patternsCount: 57,
    highlightPatterns: [
      'Model 1 (51 Patterns): Geometric Cube LD188051/52, Damask GU873605, Botanicals',
      'Model 2 (6 Metallic Textures): LX888041, LX888042, LX888044, LX888051, LX888052, LX888054',
    ],
    matchingAccessories: [
      'Professional Wallpaper Primer & Paste',
      'Smoothing Roller & Seam Cutter Tools',
    ],
    featured: false,
  },

  // 12. PVC panels
  {
    id: 'pvc-panels',
    name: 'PVC Panels',
    category: 'Wall & Surface',
    tagline: 'Affordable, waterproof interlocking wall and ceiling panels in 2-groove and 10-groove options.',
    whatIsIt:
      'Polyvinyl Chloride panels engineered for quick-cladding living rooms, corridors, and bathrooms. Available in flat matrix patterns, 2-groove plank profiles, and 10-groove slatted profiles.',
    whyChooseIt: [
      '100% Waterproof, fire-retardant, and termite resistant',
      'Cost-effective and fast overlapping installation with frame works',
      'Available in 6mm flat, 8.5mm 2-groove, and 9.5mm 10-groove depths',
      '10-15 years maintenance-free lifespan',
    ],
    applications: [
      'Residential Ceilings & Corridor Walls',
      'Commercial Restrooms & Pantries',
      'Rental Property Renovations',
      'Basement & Garage Cladding',
    ],
    image: '/products/PVC Panels.png',
    specifications: {
      dimensions: '15" x 10ft (6mm) | 1ft x 10ft (8.5mm & 9.5mm)',
      thickness: '6mm, 8.5mm, 9.5mm',
      coverage: '10 to 12.5 Sq. Ft per piece',
      lifetime: '10-15 Years',
      material: 'Virgin & Recycled PVC Polymer with protective seal',
      installation: 'Tongue and groove interlock with screws onto battens',
      boxPieceCount: '8 to 10 pieces per box',
    },
    patternsCount: 15,
    highlightPatterns: [
      'Flat: PVC01 Nova Walnut, PVC04 River Stone Grey, PVC08 Cemento Pearl, PVC09 Pastel Matrix',
      '2 Groove (8.5mm): TGP01 Snow Teak, TGP02 Ivory White, TGP03 Creamy Oak, TGP04 Urban Teak',
      '10 Groove (9.5mm): PVF001 Walnut Brown, PVF002 American Walnut',
    ],
    matchingAccessories: [
      'U-Corner Trims (10ft, 40 pcs/bundle)',
      'L-Corner Trims (10ft, 40 pcs/bundle)',
      'H-Corner Trims (10ft, 40 pcs/bundle)',
    ],
    featured: false,
  },

  // 13. PVC partition
  {
    id: 'pvc-partitions',
    name: 'PVC Partition',
    category: 'Partitions & Structural',
    tagline: 'Heavy-duty 26mm hollow-core panels to replace rough brick walls without masonry.',
    whatIsIt:
      'Rigid 26mm thick composite partition planks formulated with 40% virgin PVC and 60% stone powder. Designed to divide large spaces quickly into private cabins, meeting rooms, or clinic cubicles.',
    whyChooseIt: [
      'Direct replacement for messy, heavy brick walls',
      '20 years durability with added sound insulation and moisture resistance',
      'Quick installation within hours using basic tools and floor channels',
      'Waterproof, termite-resistant, lightweight, and eco-friendly',
      'Pre-finished on both sides with authentic wood and stone veneers',
    ],
    applications: [
      'Office Cabins & Conference Dividers',
      'Medical Clinics & Consultation Rooms',
      'Home Study Zones & Dining Partitions',
      'Retail Fitting Rooms & Stock Dividers',
    ],
    image: '/products/PVC Partition.png',
    specifications: {
      dimensions: 'Height: 9.7 Feet | Width: 1.31 Feet (15.7 inches)',
      thickness: '26mm Heavy-Duty Hollow Core',
      coverage: '12.71 Sq. Ft per panel',
      lifetime: '20 Years',
      material: '40% Virgin PVC + 60% Stone Powder & Mineral Additives',
      installation: 'Slotted into top and bottom aluminium/PVC track channels',
    },
    patternsCount: 5,
    highlightPatterns: [
      'BBPP001 Nova Walnut',
      'BBPP002 Light Tokyo',
      'BBPP003 Sea Pearl',
      'BBPP004 Blush Beige',
      'PP005 American Maple',
    ],
    matchingAccessories: [
      'PVC End Cap Profile (85mm x 50mm)',
      'Aluminium Floor & Ceiling Track Channels (Running 9.7 Feet)',
    ],
    featured: true,
  },

  // 14. Stone coated steel roofing
  {
    id: 'stone-coated-steel-roofing',
    name: 'Stone Coated Steel Roofing',
    category: 'Roofing & Exterior',
    tagline: 'Galvanized steel core with natural stone chips — 40 to 70 year lifetime protection.',
    whatIsIt:
      'Durable roofing tiles combining high-tensile galvanized steel strength with natural stone chip beauty bonded by acrylic resin. Eliminates rain drumming noise while resisting hurricanes and fires.',
    whyChooseIt: [
      '40 to 70 years lifetime warranty — the ultimate permanent roof',
      'Natural stone chip layer dampens rain noise completely',
      'Lightweight — does not require reinforced roof trusses like clay tiles',
      'Class A fire resistance and extreme wind/hail tolerance',
      'Eco-friendly and aesthetically versatile across modern and rustic architecture',
    ],
    applications: [
      'Luxury Villas & A-Frame Cabins',
      'Resorts & Eco-Tourism Cottages',
      'Commercial Clubhouses & Heritage Buildings',
      'Coastal & High-Wind Region Properties',
    ],
    image: '/products/Stone Coated Steel Roofing.png',
    specifications: {
      dimensions: 'Width: 2 Feet 8 Inch | Height: 7 Feet 7 Inch',
      thickness: '0.4mm High-Tensile Steel Core',
      coverage: '20.2 Sq. Ft per sheet',
      lifetime: '40–70 Years',
      material: 'Galvanized Steel Layer with Natural Stone Chips & Acrylic Resin',
      installation: 'Overlapping panels fixed with anti-rust fasteners onto purlins',
    },
    patternsCount: 5,
    highlightPatterns: [
      'BBSC 01 Wine Red',
      'BBSC 02 Brown Black',
      'BBSC 03 Forest Green',
      'BBSC 04 Artical Blue',
      'BBSC 05 Smoky Grey',
    ],
    matchingAccessories: [
      '3-Way Ridge & Ridge Cap (0.4mm, 3.77ft)',
      'Flat Sheet (1.5ft x 6.5ft x 0.4mm)',
      'Barge Board & Side Flashing (6.5ft x 0.4mm)',
      'Eaves Flashing & Valley Gutter (6.5ft x 0.4mm)',
    ],
    featured: true,
  },

  // 15. UPVC roofing sheet
  {
    id: 'upvc-roofing',
    name: 'uPVC Roofing Sheet',
    category: 'Roofing & Exterior',
    tagline: 'Multi-layer thermal-insulating and anti-corrosion roofing sheets for factories & terraces.',
    whatIsIt:
      'High-durability unplasticized PVC roofing sheets formulated with stabilizers, pigments, and UV inhibitors. Exceptionally weather-resistant and chemically inert against acidic rain and industrial fumes.',
    whyChooseIt: [
      '20-30 years lifespan with zero rust or chemical corrosion',
      'Superior thermal insulation — keeps interiors significantly cooler than metal sheets',
      'Dampens rain noise significantly compared to traditional tin roofing',
      'Lightweight and easily installed with screws and sealing washers',
    ],
    applications: [
      'Industrial Warehouses & Manufacturing Sheds',
      'Residential Terrace & Balcony Coverings',
      'Car Parking Sheds & Porticos',
      'Agricultural & Poultry Farm Sheds',
    ],
    image: '/products/uPVC Roofing Sheet Product Showcase.png',
    specifications: {
      dimensions: 'Width: 3.6 Feet | Lengths: 8 Feet / 10 Feet / 12.2 Feet',
      thickness: '2.5mm',
      coverage: '28.8 / 36 / 43.92 Sq. Ft per sheet',
      lifetime: '20–30 Years',
      material: 'Unplasticized PVC with UV & Thermal Stabilizers',
      installation: 'Lightweight screw installation with weather-proof sealing washers',
    },
    patternsCount: 4,
    highlightPatterns: [
      'UPVC 01 Dark Green',
      'UPVC 02 Orange',
      'UPVC 03 Navy Blue',
      'UPVC 04 Earth Brown',
    ],
    matchingAccessories: [
      'Top Ridge Tiles & Hip Ridge',
      'Wall Flashing Board & Inside Corner Deflector',
      'Three-Way Ridge & Four-Way Ridge',
      'Weatherproof Screw Caps with EPDM Washers',
    ],
    featured: false,
  },

  // 16. BondX & Professional Adhesives
  {
    id: 'adhesives-sealants',
    name: 'BondX & Professional Adhesives',
    category: 'Adhesives & Accessories',
    tagline: 'High-strength structural adhesives, nail-free glues & anti-bacterial silicone sealants.',
    whatIsIt:
      'Specialized adhesives engineered specifically for bonding polygranite sheets, WPC fluted panels, stone cladding, and aluminium trims without unsightly drilling or nails.',
    whyChooseIt: [
      'BondX Structure Adhesive (420g): High initial tack, replaces nails for wood, PVC, metal, concrete',
      'Engineer’s Bond Nail-Free Glue (300ml): Super-strength, paintable, works on wet wood & MDF',
      'BondX Silicone Sealant (480g): Anti-bacterial oxime cure, prevents mold, flexible waterproof seal',
      'No toluene, benzene, or hazardous solvents — low odor and eco-friendly',
    ],
    applications: [
      'Mounting Polygranite & PVC Wall Sheets',
      'Installing Fluted Panels and L Corners',
      'Sealing Restroom & Kitchen Joints',
      'Bonding Stair Nosing and Flooring Skirtings',
    ],
    image: '/products/adhesive.png',
    specifications: {
      dimensions: 'Cartridges: 420g (BondX), 300ml (Engineer’s Bond), 480g (Silicone)',
      thickness: 'Gap filling up to 10mm',
      coverage: 'Approx. 25-30 linear feet per cartridge',
      lifetime: 'Full cure in 7 days; 12 months shelf life',
      material: 'Polymer adhesive & neutral oxime silicone sealant',
      installation: 'Apply with cartridge gun in "Z" pattern with 40cm spacing',
    },
    patternsCount: 3,
    highlightPatterns: [
      'BondX High Strength Structure Adhesive (420g)',
      "Engineer's Bond Nail-Free Glue (300ml)",
      'BondX Anti-Bacterial Silicone Sealant (480g)',
    ],
    matchingAccessories: [
      'Heavy-Duty Skeleton Caulking Guns',
      'Replacement Nozzle Applicators',
      'Masking Tape for clean silicone bead lines',
    ],
    featured: true,
  },
];
