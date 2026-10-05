export interface IntegratedSolution {
  id: string;
  title: string;
  subtitle: string;
  interiorComponents: string[];
  automationComponents: string[];
  unifiedOutcome: string;
  image: string;
}

export const INTEGRATED_SOLUTIONS: IntegratedSolution[] = [
  {
    id: 'restaurant-solution',
    title: 'Restaurant & Dining Lounge',
    subtitle: 'Creating an unforgettable ambiance with effortless staff operations.',
    interiorComponents: [
      'Acoustic WPC fluted wall paneling for intimate dining sound dampening',
      'Mirror-finish polygranite feature walls behind the bar counter',
      'High-traffic commercial SPC waterproof wood flooring',
      'Linear warm LED ceiling coves with architectural trim',
    ],
    automationComponents: [
      'Automated transition from vibrant Lunch lighting to cozy Dinner mood presets',
      'Occupancy-driven restroom ventilation and lighting management',
      'Kitchen order pickup notification panels & access-controlled dry storerooms',
      'Real-time power monitoring across refrigeration and heavy kitchen appliances',
    ],
    unifiedOutcome: 'A modern, efficient, and premium customer experience with 28% reduced monthly utility overhead.',
    image: '/projects/restaurant.png',
  },
  {
    id: 'banquet-hall-solution',
    title: 'Grand Banquet & Convention Hall',
    subtitle: 'High-capacity luxury venue designed for weddings, galas, and corporate summits.',
    interiorComponents: [
      'Grand architectural ceiling with suspended lightweight soffit panels',
      'Decorative PU 3D stone backdrop walls for royal stage presentations',
      'Durable stain-resistant wide-plank SPC flooring ready for heavy banquet footfall',
      'Seamless aluminium transition trims avoiding all guest trip hazards',
    ],
    automationComponents: [
      'Touch-panel stage curtain motorization synchronized with event entrances',
      'DMX theatrical scene lighting controlling up to 64 zones with one tablet tap',
      'Automated climate control responding dynamically to crowd occupancy spikes',
      'VIP guest corridor access control with temporary QR code wristband scanning',
    ],
    unifiedOutcome: 'A prestigious, versatile celebration space that shifts effortlessly from daytime conferences to evening royal banquets.',
    image: '/projects/banquet.png',
  },
  {
    id: 'government-office-solution',
    title: 'Government Administrative Complex',
    subtitle: 'Dignified, secure, and low-maintenance civil infrastructure built to last decades.',
    interiorComponents: [
      'Zero-formaldehyde bamboo charcoal wall panels for healthy indoor air quality',
      'Fire-retardant and termite-proof polygranite wall cladding along public corridors',
      'Heavy-duty stone-plastic composite flooring that never needs waxing or buffing',
      'Concealed aluminium wireway conduits and impact-resistant PVC border trims',
    ],
    automationComponents: [
      'Biometric fingerprint and IR facial recognition attendance for civil officers',
      'Access-controlled security turnstiles and digital visitor pass kiosk systems',
      'Automated corridor lighting dimming after official working hours',
      'Executive elevator dispatch with biometric floor restriction',
    ],
    unifiedOutcome: 'A dignified, highly secure administrative building that dramatically reduces public maintenance costs.',
    image: '/projects/government.png',
  },
  {
    id: 'corporate-headquarters',
    title: 'Corporate Headquarters & Tech Parks',
    subtitle: 'Inspiring collaborative workspaces with enterprise-grade security.',
    interiorComponents: [
      'Acoustic felt-backed interior fluted panels eliminating meeting room echo',
      'Curved bamboo charcoal board partitions around collaborative breakout zones',
      'Matte natural oak SPC flooring engineered for quiet rolling office chairs',
      'Anodized black aluminium glass wall frames and shadow line ceiling edges',
    ],
    automationComponents: [
      'Smart meeting room booking displays with integrated occupancy sensors',
      'Circadian rhythm daylight harvesting optimizing worker alertness',
      'Smart locks with employee badge tap and temporary contractor access codes',
      'Automated blinds tracking solar glare across south-facing glass facades',
    ],
    unifiedOutcome: 'A world-class workplace that attracts top talent and enhances team productivity and health.',
    image: '/projects/tech.png',
  },
];

export interface ProjectItem {
  id: string;
  name: string;
  location: string;
  category: 'Residential' | 'Commercial' | 'Restaurants' | 'Banquet Halls' | 'Government Offices' | 'Corporate' | 'Retail';
  solutionsProvided: string[];
  image: string;
  description: string;
}

export const PROJECTS_LIST: ProjectItem[] = [
  {
    id: 'aurum-banquet-convention',
    name: 'The Grand Pavilion Banquet & Event Center',
    location: 'Hyderabad Metropole',
    category: 'Banquet Halls',
    solutionsProvided: [
      'Acoustic Fluted Ceiling Louvers',
      'PU Stone Stage Cladding',
      'Multi-Zone DMX Lighting Automation',
      'Automated Stage Drapes',
    ],
    image: '/projects/banquet.png',
    description: 'Complete turn-key transformation of a 15,000 sq.ft banquet facility combining luxurious architectural finishes with centralized scene lighting automation.',
  },
  {
    id: 'regalia-corporate-tower',
    name: 'Regalia Corporate Technology Hub',
    location: 'Cyber City Business District',
    category: 'Corporate',
    solutionsProvided: [
      'Polygranite Wall Cladding',
      'SPC Flooring throughout 6 floors',
      'Biometric Access Control on all doors',
      'Presence-based lighting sensors',
    ],
    image: '/projects/tower.png',
    description: 'Equipped an entire 6-story technology workspace with scratch-proof SPC flooring, acoustic conference louvers, and smart biometric security.',
  },
  {
    id: 'saffron-dining-lounge',
    name: 'Saffron Heritage Fine Dining Restaurant',
    location: 'Jubilee Hills Precinct',
    category: 'Restaurants',
    solutionsProvided: [
      'WPC Interior Fluted Paneling',
      'Waterproof Stone Plastic Composite Flooring',
      'Circadian Mood Lighting Automation',
      'Smart Ambient Temperature Controls',
    ],
    image: '/projects/restaurant.png',
    description: 'Crafted an intimate culinary haven featuring rich walnut fluted wall accents and an automated lighting system that transitions seamlessly from sunset to late night.',
  },
  {
    id: 'civil-administration-secretariat',
    name: 'Regional District Administrative Secretariat',
    location: 'Government Administrative Enclave',
    category: 'Government Offices',
    solutionsProvided: [
      'Anti-bacterial Bamboo Charcoal Wall Panels',
      'Heavy Commercial SPC Flooring',
      'Biometric Attendance & Turnstile Access',
      'Visitor Security Management System',
    ],
    image: '/projects/chamber.png',
    description: 'Modernized civil office chambers with fire-safe zero-formaldehyde wall paneling, durable stone-composite flooring, and digital credential access control.',
  },
  {
    id: 'zenith-luxury-penthouse',
    name: 'The Crown Villa & Penthouse Residence',
    location: 'Palm Boulevard',
    category: 'Residential',
    solutionsProvided: [
      'Bookmatched Polygranite Feature Walls',
      'Ultra-silent Motorized Curtains',
      'Smart Face Recognition Door Entry',
      'Whole-Home Intelligent Lighting',
    ],
    image: '/projects/pent.png',
    description: 'An expansive private penthouse designed with custom Italian marble-look polygranite sheets, herringbone SPC flooring, and automated curtains and door locks.',
  },
  {
    id: 'vogue-flagship-showroom',
    name: 'Vogue Couture & Luxury Retail Flagship',
    location: 'High Street Fashion District',
    category: 'Retail',
    solutionsProvided: [
      'Architectural Gold Aluminium Trims',
      'High-Gloss Polygranite Display Backdrops',
      'CCTV & Footfall Analytics Sensors',
      'Motion-activated Display Spotlights',
    ],
    image: '/projects/retail.png',
    description: 'Designed a pristine luxury boutique where products shine against marble-pattern polygranite surfaces with smart spotlights that highlight new apparel arrivals.',
  },
];

export interface SpaceSolution {
  title: string;
  categoryKey: string;
  description: string;
  howWeHelp: string;
  interiorHighlights: string[];
  automationHighlights: string[];
}

export const SPACE_SOLUTIONS: SpaceSolution[] = [
  {
    title: 'Residential Homes & Villas',
    categoryKey: 'Residential',
    description: 'Turn your private home into an oasis of luxury materials and effortless convenience.',
    howWeHelp: 'We integrate marble-finish polygranite feature walls, scratch-proof SPC flooring, and keyless biometric entry so your family enjoys five-star hotel comfort every day.',
    interiorHighlights: ['Marble-finish living walls', 'Acoustic fluted headboards', 'Warm waterproof flooring'],
    automationHighlights: ['Fingerprint door entry', 'Motorized curtains', 'App-controlled ambient lighting'],
  },
  {
    title: 'Corporate & Tech Offices',
    categoryKey: 'Corporate',
    description: 'Modern workplaces that foster focus, collaboration, and high-performance teams.',
    howWeHelp: 'We install acoustic fluted panels that deaden echo in meeting rooms, durable flooring for rolling chairs, and badge access systems that protect intellectual property.',
    interiorHighlights: ['Acoustic conference walls', 'Curved bamboo charcoal partitions', 'Heavy commercial flooring'],
    automationHighlights: ['Smart access turnstiles', 'Daylight harvesting sensors', 'Room booking panels'],
  },
  {
    title: 'Restaurants & Lounges',
    categoryKey: 'Restaurants',
    description: 'Captivating dining environments that elevate customer satisfaction and maximize table turn.',
    howWeHelp: 'We combine warm fluted timber accents and waterproof easy-clean flooring with scheduled mood lighting that effortlessly shifts the vibe from lunch to dinner.',
    interiorHighlights: ['Acoustic wall louvers', 'Easy-clean stainproof floors', 'Mirror-finish bar walls'],
    automationHighlights: ['Scheduled lighting presets', 'Restroom sensor management', 'Energy optimization'],
  },
  {
    title: 'Banquet Halls & Ballrooms',
    categoryKey: 'Banquet Halls',
    description: 'Grand celebration halls engineered for majestic events and rapid turnarounds.',
    howWeHelp: 'We construct high-durability decorative stone walls, impact-resistant flooring, and automated stage drapes and DMX lighting controlled with one master tablet.',
    interiorHighlights: ['3D PU stone stage backdrops', 'High-capacity wide-plank flooring', 'Decorative ceiling louvers'],
    automationHighlights: ['Automated stage drapes', 'Multi-zone scene lighting', 'Dynamic crowd climate control'],
  },
  {
    title: 'Government & Public Offices',
    categoryKey: 'Government',
    description: 'Dignified, durable civic architecture built for heavy public traffic with minimal upkeep.',
    howWeHelp: 'We install zero-maintenance termite-proof polygranite wall cladding, non-slip SPC flooring, and biometric attendance and visitor registration systems.',
    interiorHighlights: ['Termite-proof stone cladding', 'Non-slip commercial flooring', 'Fire-safe wall panels'],
    automationHighlights: ['Biometric employee access', 'Digital visitor passes', 'After-hours energy cutoffs'],
  },
  {
    title: 'Commercial & Multi-Tenant Buildings',
    categoryKey: 'Commercial',
    description: 'Modern infrastructure that elevates property value and attracts premium tenants.',
    howWeHelp: 'We deliver all-weather exterior cladding, high-traffic elevator lobby wall panels, and destination-dispatch elevator controls with smart security integration.',
    interiorHighlights: ['Exterior UV facade louvers', 'Elevator lobby wall panels', 'Aluminium edge systems'],
    automationHighlights: ['Smart elevator floor access', 'Automated security doors', 'CCTV surveillance integration'],
  },
  {
    title: 'Retail Showrooms & Boutiques',
    categoryKey: 'Retail',
    description: 'High-impact product backdrops that draw eyes and enhance brand value.',
    howWeHelp: 'We provide high-gloss marble panels, warm fluted columns, and smart presence spotlights that accentuate featured collections as customers walk by.',
    interiorHighlights: ['High-contrast display panels', 'Seamless floor transitions', 'Architectural metal trims'],
    automationHighlights: ['Presence-activated spotlights', 'Store opening/closing scenes', 'Footfall monitoring'],
  },
  {
    title: 'Hospitality & Luxury Hotels',
    categoryKey: 'Hospitality',
    description: 'Quiet, sumptuous guest experiences where comfort and elegance meet seamlessly.',
    howWeHelp: 'We furnish guest rooms and public lobbies with soundproof acoustic wall panels, waterproof luxury flooring, and keyless mobile check-in door locks.',
    interiorHighlights: ['Soundproof guestroom panels', 'Lobby statement stone walls', 'Moisture-safe bath panels'],
    automationHighlights: ['Mobile keyless door unlock', 'Welcome lighting scenes', 'Automated blackout shades'],
  },
];

export interface GalleryPhoto {
  id: string;
  title: string;
  category: 'Interior Products' | 'Smart Automation' | 'Completed Projects' | 'Architectural Spaces';
  image: string;
  caption: string;
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'gal-1',
    title: 'Executive Boardroom Feature Wall',
    category: 'Interior Products',
    image: '/automation/wall.png',
    caption: 'Interlocking WPC fluted louvers paired with bookmatched polygranite stone paneling.',
  },
  {
    id: 'gal-2',
    title: 'Biometric Smart Access Lock',
    category: 'Smart Automation',
    image: '/automation/smartdoor.png',
    caption: 'Brushed metal smart biometric door lock with illuminated keypad and sub-second fingerprint scanner.',
  },
  {
    id: 'gal-3',
    title: 'The Grand Pavilion Banquet Hall',
    category: 'Completed Projects',
    image: '/projects/banquet.png',
    caption: '15,000 sq.ft banquet facility featuring automated multi-zone mood lighting and acoustic ceiling systems.',
  },
  {
    id: 'gal-4',
    title: 'Architectural Hybrid Living Space',
    category: 'Architectural Spaces',
    image: '/automation/architectural.png',
    caption: 'Unified architecture combining natural stone surfaces, fluted wood accents, and smart environment controls.',
  },
  {
    id: 'gal-5',
    title: 'Natural Oak SPC Luxury Flooring',
    category: 'Interior Products',
    image: '/projects/flooring.png',
    caption: 'Commercial-grade waterproof SPC flooring with realistic embossed-in-register wood grain texture.',
  },
  {
    id: 'gal-6',
    title: 'Corporate Reception & Security Access',
    category: 'Completed Projects',
    image: '/automation/auto.png',
    caption: 'Keyless turnstile integration and smart entry doors installed at Regalia Technology Hub.',
  },
];
