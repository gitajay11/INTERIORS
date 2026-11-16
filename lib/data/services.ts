import type { Service } from "@/lib/types";

const img = (slug: string, shot: string, alt: string) => ({
  src: `/images/projects/${slug}/${shot}.jpg`,
  alt,
  width: 1600,
  height: 1067,
});

const standardProcess = [
  { title: "Discover", text: "A site visit and a long conversation about how you live or work." },
  { title: "Concept", text: "Plans, mood boards and a material palette for your sign-off." },
  { title: "3D Visualize", text: "Walk through the design in 3D before anything is ordered." },
  { title: "Execute", text: "Our site team manages contractors, quality and programme." },
  { title: "Handover", text: "Styling, snag-free handover and a twelve-month aftercare visit." },
];

export const services: Service[] = [
  {
    slug: "residential-interiors",
    title: "Residential interiors",
    icon: "home",
    summary: "Complete homes, from first sketch to the last cushion.",
    description: [
      "We design apartments, villas and family homes as a whole: architecture, joinery, lighting, furniture and art considered together so each room leads naturally to the next.",
      "Most residential projects run six to twelve months. You will have one lead designer throughout, supported by our technical and procurement teams.",
    ],
    included: [
      "Space planning and furniture layouts",
      "Material, colour and lighting schemes",
      "Bespoke joinery and kitchen design",
      "Furniture, art and accessory sourcing",
      "Site supervision and contractor management",
      "Styling and photography on completion",
    ],
    process: standardProcess,
    faqs: [
      {
        question: "What size of home do you take on?",
        answer:
          "From single rooms of 500 sq.ft to villas of 10,000 sq.ft. For smaller scopes we offer a design-only package.",
      },
      {
        question: "Can we stay in the house during the work?",
        answer:
          "Often, yes. We phase the programme room by room and seal off working areas. We will tell you honestly if moving out is the better option.",
      },
      {
        question: "How are your fees structured?",
        answer:
          "A fixed design fee agreed up front, plus a transparent percentage on procurement. There are no hidden supplier commissions.",
      },
    ],
    image: img("boat-club-residence", "wide", "Living room designed by Interiors"),
    sampleCategories: ["Living", "Apartment", "Villa", "Bedroom"],
  },
  {
    slug: "commercial-interiors",
    title: "Commercial interiors",
    icon: "building",
    summary: "Offices, boutiques and restaurants that work as hard as they look.",
    description: [
      "Commercial spaces must earn their keep. We start with your operations — covers per night, heads per desk, dwell time per customer — and design the experience around them.",
      "Our commercial team coordinates MEP consultants, landlord approvals and phased fit-outs so you can open on the date you announced.",
    ],
    included: [
      "Brand and operations workshop",
      "Test fits and occupancy planning",
      "Fit-out drawings and landlord submissions",
      "Custom furniture and display systems",
      "Acoustic and lighting design",
      "Out-of-hours and phased delivery",
    ],
    process: standardProcess,
    faqs: [
      {
        question: "Do you handle statutory approvals?",
        answer:
          "Yes. We prepare fire, landlord and municipal submissions with our partner consultants.",
      },
      {
        question: "Can you work to a franchise or brand manual?",
        answer: "We regularly adapt global brand guidelines to local sites, materials and budgets.",
      },
      {
        question: "How fast can a fit-out be delivered?",
        answer:
          "A 2,000 sq.ft boutique typically takes 10–14 weeks from concept sign-off to opening.",
      },
    ],
    image: img("atlas-capital-office", "wide", "Partner office designed by Interiors"),
    sampleCategories: ["Office", "Retail", "Hospitality"],
  },
  {
    slug: "space-planning",
    title: "Space planning",
    icon: "ruler",
    summary: "Layouts that make every square foot useful.",
    description: [
      "Good rooms begin as good plans. We study circulation, daylight, storage and sightlines, then test several layouts before recommending one.",
      "Space planning is available on its own for clients who have a contractor but want the plan resolved by a designer first.",
    ],
    included: [
      "Measured survey and existing-condition drawings",
      "Three alternative layouts with pros and cons",
      "Furniture plans at 1:50",
      "Electrical and lighting points plan",
      "Storage audit and joinery sizing",
      "A 3D massing model of the chosen option",
    ],
    process: standardProcess.slice(0, 3),
    faqs: [
      {
        question: "Will you move walls?",
        answer:
          "If it improves the plan and the structure allows it. We work with a structural engineer on any change to load-bearing elements.",
      },
      {
        question: "What do I receive at the end?",
        answer:
          "A drawing set your contractor can price and build from, plus the 3D model to explore.",
      },
    ],
    image: img("adyar-kitchen", "plan", "Plan view of a kitchen and dining room"),
    sampleCategories: ["Kitchen", "Apartment", "Office"],
  },
  {
    slug: "furniture-selection",
    title: "Furniture selection",
    icon: "sofa",
    summary: "Sourced, commissioned and placed with a collector's eye.",
    description: [
      "We select furniture the way a curator hangs a show: for how pieces speak to one another. Our library covers Indian workshops, European houses and a small circle of makers we commission directly.",
      "Every scheme is checked for scale in 3D before orders are placed, and we manage delivery, installation and aftercare.",
    ],
    included: [
      "Furniture, lighting and rug schedules",
      "Fabric and finish selection with samples",
      "Bespoke pieces from our partner workshops",
      "Budget tracking against every line item",
      "Order management, delivery and installation",
      "Art and accessory styling",
    ],
    process: standardProcess,
    faqs: [
      {
        question: "Can you work with pieces we already own?",
        answer: "Yes — we will measure them, model them and design around the ones worth keeping.",
      },
      {
        question: "Do you mark up furniture?",
        answer:
          "No. You pay trade price plus our stated procurement fee, and you see every invoice.",
      },
    ],
    image: img("alwarpet-loft", "detail", "Nesting tables and a curved sofa"),
    sampleCategories: ["Living", "Apartment", "Retail"],
  },
  {
    slug: "lighting-design",
    title: "Lighting design",
    icon: "lamp",
    summary: "Layered light for morning, evening and everything between.",
    description: [
      "Light decides how every other choice is seen. We plan ambient, task and accent layers on separate circuits so a room can move from bright and practical to low and warm.",
      "Schemes include fitting specifications, colour temperatures, dimming protocols and scene programming.",
    ],
    included: [
      "Daylight study of each room",
      "Layered lighting plans and circuit schedule",
      "Decorative fitting selection",
      "Architectural fitting specification (CRI 95+)",
      "Dimming and scene-control design",
      "On-site focusing and programming",
    ],
    process: standardProcess,
    faqs: [
      {
        question: "Can lighting be improved without rewiring?",
        answer:
          "Often. Lamps, plug-in wall lights and smart dimmers can transform a room with no chasing at all.",
      },
      {
        question: "Which colour temperature do you recommend?",
        answer:
          "2700K for living spaces and bedrooms, 3000K for kitchens and work areas, always with high colour rendering.",
      },
    ],
    image: img("adyar-kitchen", "detail", "Brass pendants over an oak dining table"),
    sampleCategories: ["Kitchen", "Hospitality", "Living"],
  },
  {
    slug: "renovation-remodeling",
    title: "Renovation & remodeling",
    icon: "hammer",
    summary: "Careful transformations of the home you already love.",
    description: [
      "Renovation asks for patience and honesty. We survey what exists, keep what is good and replace what is not — with a programme and budget that include a sensible contingency.",
      "Our site managers are on site daily, and you receive a written progress report with photographs every Friday.",
    ],
    included: [
      "Condition survey and feasibility study",
      "Structural, plumbing and electrical upgrades",
      "Kitchen and bathroom remodeling",
      "Flooring, plastering and decorating",
      "Weekly reporting and budget tracking",
      "Twelve-month defects cover",
    ],
    process: standardProcess,
    faqs: [
      {
        question: "How much contingency should we allow?",
        answer:
          "We recommend 10–15% for homes over twenty years old. Unused contingency is returned to you.",
      },
      {
        question: "Do you renovate single rooms?",
        answer:
          "Yes. Kitchens, bathrooms and primary suites are our most common single-room projects.",
      },
      {
        question: "Who manages the contractors?",
        answer: "We do. You have one point of contact and one contract.",
      },
    ],
    image: img("besant-nagar-suite", "after", "Renovated bedroom suite"),
    sampleCategories: ["Bedroom", "Kitchen", "Villa"],
  },
];
