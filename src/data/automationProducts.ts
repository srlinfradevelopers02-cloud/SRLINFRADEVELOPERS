export interface AutomationProduct {
  name: string;
  description: string;
  image: string;
}

export interface AutomationCategory {
  id: string;
  name: string;
  shortSummary: string;
  headline: string;
  description: string;
  keyFeatures: string[];
  products: AutomationProduct[];
  realWorldExamples: {
    title: string;
    description: string;
    icon: string;
  }[];
  heroImage: string;
}

export const AUTOMATION_CATEGORIES: AutomationCategory[] = [
  // ============================================================
  // 1. SMART DOORS & ACCESS
  // ============================================================
  {
    id: 'smart-doors',
    name: 'Smart Doors & Access',

    shortSummary:
      'Secure access systems that combine automation, convenience, and modern access control.',

    headline:
      'Secure your space with intelligent doors, locks, and automated gate systems.',

    description:
      'Modern access should be secure, convenient, and easy to manage. Our smart access solutions combine digital door locks, automated gates, biometric access, mobile control, and intelligent entry systems for residential and commercial spaces.',

    keyFeatures: [
      'Fingerprint, PIN, RFID, mobile and physical key access',
      'Automated sliding, swing, and folding gates',
      'Remote access and mobile control',
      'Temporary and controlled access for visitors',
      'Secure access solutions for homes, offices, hotels, and commercial properties',
    ],

    products: [
      {
        name: 'Gate Motors',
        description:
          'Automated sliding, swing, and folding gate solutions for convenient and secure property access.',
        image: '/automation/gate-motors.png',
      },

      {
        name: 'Digital Door Locks',
        description:
          'Modern keyless entry using fingerprint, PIN, RFID card, mobile access, and other intelligent access technologies.',
        image: '/automation/digital-door-locks.png',
      },
    ],

    realWorldExamples: [
      {
        title: 'Biometric Fingerprint Access',
        description:
          'Secure entry using fingerprint recognition for authorized users.',
        icon: 'Fingerprint',
      },

      {
        title: 'Smart Gate Automation',
        description:
          'Automatically open and close property gates using remote or smart access control.',
        icon: 'DoorOpen',
      },

      {
        title: 'Mobile Access',
        description:
          'Control connected doors and gates remotely through a smartphone.',
        icon: 'Smartphone',
      },

      {
        title: 'RFID Access',
        description:
          'Fast contactless access for staff, residents, and authorized users.',
        icon: 'CreditCard',
      },
    ],

    heroImage: '/automation/smartdoor.png',
  },

  // ============================================================
  // 2. SMART LIGHTING & CONTROLS
  // ============================================================
  {
    id: 'smart-lighting',
    name: 'Smart Lighting & Controls',

    shortSummary:
      'Intelligent switches, touch panels, sensors, and lighting systems designed around modern spaces.',

    headline:
      'Intelligent lighting and control systems designed around how your spaces are used.',

    description:
      'Create comfortable and energy-efficient spaces with intelligent switches, touch panels, motion sensors, sensor lights, architectural lighting, and automated scenes.',

    keyFeatures: [
      'Smart touch panels and switch systems',
      'Motion and occupancy-based lighting',
      'Automated lighting scenes',
      'Daylight-aware lighting control',
      'Architectural and accent lighting',
      'Energy-efficient lighting automation',
    ],

    products: [
      {
        name: 'Touch Panels',
        description:
          'Elegant touch controls for lighting, scenes, curtains, and connected devices.',
        image: '/automation/touch-panels.png',
      },

      {
        name: 'Edge Panels',
        description:
          'Modern modular switch and socket panels designed for residential and commercial interiors.',
        image: '/automation/edge-panels.png',
      },

      {
        name: 'Color Panels',
        description:
          'Stylish touch panels available in modern finishes for smart and premium interiors.',
        image: '/automation/colour-panels.png',
      },

      {
        name: 'Touch Plus',
        description:
          'Advanced touch panels available in multiple switch configurations for modern smart spaces.',
        image: '/automation/touch-plus.png',
      },

      {
        name: 'Retrofit Controllers',
        description:
          'Upgrade existing electrical systems with smart automation without major rewiring.',
        image: '/automation/retrofit-controllers.png',
      },

      {
        name: 'Kinetic Switches',
        description:
          'Wireless switching solutions that provide flexible installation without conventional wiring requirements.',
        image: '/automation/kinetic-switches.png',
      },

      {
        name: 'Motion Sensors',
        description:
          'Intelligent motion detection for automated lighting, security, and smart control.',
        image: '/automation/motion-sensors.png',
      },

      {
        name: 'Sensor Lights',
        description:
          'Automatic lighting solutions that respond to movement and surrounding conditions.',
        image: '/automation/sensor-lights.png',
      },

      {
        name: 'Spot Lights',
        description:
          'Focused architectural lighting for interiors, displays, walls, ceilings, and feature areas.',
        image: '/automation/spot-lights.png',
      },
    ],

    realWorldExamples: [
      {
        title: 'Presence-Aware Lighting',
        description:
          'Lights automatically activate when people enter a space and switch off after the area becomes vacant.',
        icon: 'Footprints',
      },

      {
        title: 'Smart Scene Control',
        description:
          'One touch can activate predefined lighting scenes such as Movie, Dinner, Meeting, or Night.',
        icon: 'Sliders',
      },

      {
        title: 'Daylight-Based Lighting',
        description:
          'Lighting levels can respond to available natural light to maintain comfortable illumination.',
        icon: 'SunMedium',
      },

      {
        title: 'Automated Architectural Lighting',
        description:
          'Facade and feature lighting can operate according to schedules and environmental conditions.',
        icon: 'Clock',
      },
    ],

    heroImage: '/automation/smartlight.png',
  },

  // ============================================================
  // 3. SMART SECURITY & SURVEILLANCE
  // ============================================================
  {
    id: 'smart-security',
    name: 'Smart Security & Surveillance',

    shortSummary:
      'Connected video door systems, surveillance, monitoring, and intelligent security solutions.',

    headline:
      'Monitor and protect your premises with integrated security technology.',

    description:
      'Protect residential and commercial spaces with connected video door systems, surveillance solutions, visitor management, remote monitoring, and intelligent security alerts.',

    keyFeatures: [
      'HD video door communication',
      'Two-way audio communication',
      'Remote visitor monitoring',
      'Smart visitor access',
      'Mobile security notifications',
      'Centralized monitoring solutions',
    ],

    products: [
      {
        name: 'Video Door',
        description:
          'See, communicate with, and manage visitors before granting access using connected video door systems.',
        image: '/automation/video-door.png',
      },
    ],

    realWorldExamples: [
      {
        title: 'Smart Video Intercom',
        description:
          'See and communicate with visitors before allowing them to enter.',
        icon: 'Video',
      },

      {
        title: 'Remote Visitor Access',
        description:
          'Respond to visitors and control access remotely through connected devices.',
        icon: 'Smartphone',
      },

      {
        title: 'Visitor Monitoring',
        description:
          'Monitor entrances and visitor activity from a centralized system.',
        icon: 'MonitorCheck',
      },

      {
        title: 'Smart Security Alerts',
        description:
          'Receive notifications when important security events occur.',
        icon: 'ShieldAlert',
      },
    ],

    heroImage: '/automation/smartcamera.png',
  },

  // ============================================================
  // 4. SMART ENVIRONMENT & COMFORT
  // ============================================================
  {
    id: 'smart-environment',
    name: 'Smart Environment & Comfort',

    shortSummary:
      'Motorized curtains, lighting, climate control, smart displays, and comfort automation.',

    headline:
      'A smart environment that adapts around your comfort, convenience, and lifestyle.',

    description:
      'Create responsive environments where curtains, lighting, climate, and smart controls work together. These solutions are suitable for homes, offices, hotels, restaurants, banquet halls, and commercial spaces.',

    keyFeatures: [
      'Motorized curtain automation',
      'Smart lighting and ambience control',
      'Temperature and climate automation',
      'Smart touch displays',
      'Scene-based environmental control',
      'Energy-conscious automation',
    ],

    products: [
      {
        name: 'Curtain Motors',
        description:
          'Smooth and quiet automated curtain control for homes, offices, hotels, restaurants, and commercial spaces.',
        image: '/automation/curtain-motors.png',
      },

      {
        name: 'Smart Displays',
        description:
          'Centralized touch control for lighting, scenes, climate, curtains, and connected smart devices.',
        image: '/automation/smart-displays.png',
      },

      {
        name: 'Lighting & Climate Automation',
        description:
          'Integrated lighting and climate solutions designed to improve comfort, ambience, and energy management.',
        image: '/automation/smart-lighting-climate.png',
      },
    ],

    realWorldExamples: [
      {
        title: 'Automated Motorized Curtains',
        description:
          'Curtains can open and close according to schedules, scenes, daylight, and privacy requirements.',
        icon: 'Blinds',
      },

      {
        title: 'Smart Climate Control',
        description:
          'Temperature settings can respond to room conditions, schedules, occupancy, and outdoor conditions.',
        icon: 'Thermometer',
      },

      {
        title: 'Smart Display Control',
        description:
          'A centralized display can provide convenient control over multiple connected systems.',
        icon: 'Tablet',
      },

      {
        title: 'Energy Management',
        description:
          'Connected systems can help manage lighting and climate usage for improved energy efficiency.',
        icon: 'Zap',
      },
    ],

    heroImage: '/automation/smartcurtain.png',
  },

  // ============================================================
  // 5. SMART ENTERTAINMENT
  // ============================================================
  {
    id: 'smart-entertainment',
    name: 'Smart Entertainment',

    shortSummary:
      'Premium audio, projection, screens, and immersive entertainment solutions.',

    headline:
      'Transform spaces with immersive audio-visual entertainment technology.',

    description:
      'Create premium entertainment environments with integrated audio and visual solutions. From luxury home theatres to commercial presentation rooms, every component can be designed around the space and user experience.',

    keyFeatures: [
      'Premium multi-room audio',
      'Floor-standing speakers',
      'In-wall and in-ceiling speakers',
      'On-wall and bookshelf speakers',
      'Soundbars and satellite speakers',
      '4K and Full HD projectors',
      'Ultra-short, short, and long throw projection',
      'Fixed-frame and motorized screens',
      'Projector mounts and motorized lifts',
    ],

    products: [
      {
        name: 'AUDIO',
        description:
          'Premium audio solutions including floor-standing, in-wall, on-wall, in-ceiling, satellite, bookshelf, soundbar, wireless multi-room, and outdoor speakers.',
        image: '/automation/audio.png',
      },
      {
        name: 'VIDEO',
        description:
          'High-quality video solutions including 4K and Full HD projectors, ultra-short, short, and long throw projection, and fixed-frame and motorized screens.',
        image: '/automation/video.png',
      }
    ],

    realWorldExamples: [
      {
        title: 'Luxury Home Theatre',
        description:
          'Integrated projector, screen, surround audio, lighting scenes, and automated controls.',
        icon: 'Film',
      },

      {
        title: 'Multi-Room Audio',
        description:
          'Distribute synchronized or independent audio throughout multiple rooms and spaces.',
        icon: 'Music',
      },

      {
        title: 'Commercial Presentation Room',
        description:
          'Professional projection, audio, screen, and control systems for meetings and presentations.',
        icon: 'Presentation',
      },

      {
        title: 'Immersive Entertainment',
        description:
          'Combine lighting, audio, video, and automated scenes for a complete entertainment experience.',
        icon: 'Sparkles',
      },
    ],

    heroImage: '/automation/home-theatre.png',
  },
];

// ============================================================
// HOW AUTOMATION WORKS
// ============================================================

export interface AutomationSimulationStep {
  stepNumber: string;
  name: string;
  tagline: string;
  explanation: string;
  example: string;
  icon: string;
}

export const HOW_IT_WORKS_STEPS: AutomationSimulationStep[] = [
  {
    stepNumber: 'STEP 1',

    name: 'SENSE',

    tagline: 'Detecting the physical environment',

    explanation:
      'Sensors continuously monitor movement, occupant presence, temperature, light levels, access events, or other environmental conditions.',

    example:
      'A person approaches the office entrance and the system detects their presence.',

    icon: 'Radio',
  },

  {
    stepNumber: 'STEP 2',

    name: 'THINK',

    tagline: 'Processing rules & authorization',

    explanation:
      'The automation controller processes sensor information, schedules, user permissions, and configured rules to determine the appropriate response.',

    example:
      'The controller verifies the user and checks whether access is permitted at that time.',

    icon: 'Cpu',
  },

  {
    stepNumber: 'STEP 3',

    name: 'ACT',

    tagline: 'Executing an instant response',

    explanation:
      'The system activates the appropriate devices such as lights, locks, curtains, climate systems, gates, or other connected equipment.',

    example:
      'The gate opens, pathway lights turn on, and the required environment settings are activated.',

    icon: 'Zap',
  },

  {
    stepNumber: 'STEP 4',

    name: 'CONTROL',

    tagline: 'User oversight & adjustments',

    explanation:
      'Users can view system status, change settings, create scenes, manage schedules, or manually override automation through connected interfaces.',

    example:
      'A facility manager checks the system status and adjusts the lighting or access settings from a smart display.',

    icon: 'Smartphone',
  },
];