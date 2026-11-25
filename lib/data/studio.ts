import type { Award, Milestone, TeamMember, Testimonial } from "@/lib/types";

const socials = (handle: string) => [
  { name: "LinkedIn", href: `https://www.linkedin.com/in/${handle}` },
  { name: "Instagram", href: `https://www.instagram.com/${handle}` },
];

export const team: TeamMember[] = [
  {
    slug: "meera-verano",
    name: "Meera Verano",
    role: "Founder & Principal Designer",
    bio: [
      "Meera founded the studio in 2011 after eight years with practices in Milan and Mumbai. She leads the concept stage of every project and still draws by hand before anything is modelled.",
      "She lectures on residential design at Srishti Manipal Institute and sits on the jury of the India Design Awards.",
    ],
    expertise: ["Concept design", "Residential", "Art curation"],
    tint: "#c8b99d",
    socials: socials("meeraverano"),
  },
  {
    slug: "arjun-nair",
    name: "Arjun Nair",
    role: "Design Director, Commercial",
    bio: [
      "Arjun runs our workplace, retail and hospitality projects. Trained as an architect, he is happiest resolving a difficult plan.",
      "Before joining in 2016 he delivered flagship stores across South-East Asia for a global fashion group.",
    ],
    expertise: ["Workplace strategy", "Retail", "Hospitality"],
    tint: "#a9b19a",
    socials: socials("arjunnair"),
  },
  {
    slug: "kavya-rao",
    name: "Kavya Rao",
    role: "Head of 3D Visualisation",
    bio: [
      "Kavya built the studio's real-time 3D pipeline, Clients walk through her models long before work begins on site.",
      "She holds a master's in computational design from CEPT University.",
    ],
    expertise: ["Real-time 3D", "Lighting studies", "Material simulation"],
    tint: "#b8c4c9",
    socials: socials("kavyarao"),
  },
  {
    slug: "daniel-thomas",
    name: "Daniel Thomas",
    role: "Senior Interior Designer",
    bio: [
      "Daniel leads our villa and holiday-home projects along the west coast. His schemes are known for quiet palettes and exacting joinery.",
      "He joined in 2018 from a furniture workshop in Kochi and still prototypes pieces himself.",
    ],
    expertise: ["Bespoke joinery", "Villas", "Furniture design"],
    tint: "#c49a7c",
    socials: socials("danielthomas"),
  },
  {
    slug: "ishita-menon",
    name: "Ishita Menon",
    role: "Materials & Procurement Lead",
    bio: [
      "Ishita keeps our materials library — more than two thousand samples — and the relationships with the workshops behind them.",
      "She makes sure what was specified is what arrives, on the day it was promised.",
    ],
    expertise: ["Material sourcing", "Sustainability", "Vendor management"],
    tint: "#d9c9b0",
    socials: socials("ishitamenon"),
  },
  {
    slug: "rohan-shetty",
    name: "Rohan Shetty",
    role: "Head of Projects",
    bio: [
      "Rohan and his site managers turn drawings into rooms. He writes the programme, chairs the weekly site meeting and signs off every handover.",
      "A civil engineer by training, he has delivered more than 150 of the studio's projects.",
    ],
    expertise: ["Project management", "Quality control", "Cost planning"],
    tint: "#b5a696",
    socials: socials("rohanshetty"),
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Priya & Karthik Iyer",
    projectType: "Family residence",
    location: "Chennai",
    rating: 5,
    quote:
      "We walked through our living room in 3D months before the furniture arrived. The finished house matched it almost to the centimetre — and feels even better than the model.",
    tint: "#c8b99d",
  },
  {
    name: "Sanjana Reddy",
    projectType: "Boutique fit-out",
    location: "Hyderabad",
    rating: 5,
    quote:
      "They understood that my clients buy sitting down. Sales per appointment are up by a third since we reopened.",
    tint: "#c49a7c",
  },
  {
    name: "Vikram Malhotra",
    projectType: "Corporate office",
    location: "Mumbai",
    rating: 5,
    quote:
      "Delivered in three weekend phases without a single lost trading day. The partners now fight over who gets the library rooms.",
    tint: "#b8c4c9",
  },
  {
    name: "Leela D'Souza",
    projectType: "Holiday villa",
    location: "Alibaug",
    rating: 5,
    quote:
      "Every material was chosen for the sea air and it shows. Two monsoons later the house looks exactly as it did at handover.",
    tint: "#a9b19a",
  },
  {
    name: "Aditya Kulkarni",
    projectType: "Restaurant",
    location: "Goa",
    rating: 4,
    quote:
      "Calm, organised and honest about cost from the first meeting. Guests ask who designed the room almost every night.",
    tint: "#d9c9b0",
  },
];

export const awards: Award[] = [
  {
    title: "Residential Interior of the Year",
    organisation: "India Design Awards",
    year: 2025,
    project: "Boat Club Residence",
  },
  {
    title: "Best Workplace under 10,000 sq.ft",
    organisation: "FOAID Design Honours",
    year: 2025,
    project: "Atlas Capital Office",
  },
  {
    title: "AD100 Most Influential Designers",
    organisation: "Architectural Digest India",
    year: 2024,
  },
  {
    title: "Hospitality Interior — Gold",
    organisation: "Trends Excellence Awards",
    year: 2024,
    project: "The Fig House",
  },
  {
    title: "Best Use of Material",
    organisation: "Kyoorius Design Awards",
    year: 2023,
    project: "Villa Sagar",
  },
  {
    title: "Retail Design — Winner",
    organisation: "IIID Design Excellence",
    year: 2023,
    project: "Maison Nila Boutique",
  },
  { title: "Emerging Practice of the Year", organisation: "Elle Decor India", year: 2019 },
  { title: "Young Designer Award", organisation: "India Design Awards", year: 2015 },
];

export const milestones: Milestone[] = [
  {
    year: 2011,
    title: "A studio of two",
    text: "Meera Verano opens the practice in a single room above a framer's shop in Mylapore.",
  },
  {
    year: 2014,
    title: "First villa",
    text: "A 6,000 sq.ft home in Coorg becomes our first ground-up interior and our first published project.",
  },
  {
    year: 2016,
    title: "Commercial team",
    text: "Arjun Nair joins to lead workplace, retail and hospitality commissions.",
  },
  {
    year: 2019,
    title: "Khader Nawaz Khan Road",
    text: "We move to our current studio, with a materials library and a full-scale mock-up room.",
  },
  {
    year: 2022,
    title: "Real-time 3D",
    text: "Every project is now designed, reviewed and signed off in an interactive 3D model.",
  },
  {
    year: 2025,
    title: "Two hundred and forty homes",
    text: "The studio is thirty-two people working across nine cities — still with one lead designer per client.",
  },
];

export const philosophy = [
  {
    title: "Light first",
    text: "We read the daylight in a room before we draw a line. Orientation decides palette, not fashion.",
    image: "boat-club-residence/side",
  },
  {
    title: "Fewer, better things",
    text: "A room needs less than you think. We would rather commission one table that lasts than fill a floor plan.",
    image: "adyar-kitchen/detail",
  },
  {
    title: "Honest materials",
    text: "Oak that is oak, stone that is stone. Natural materials age; we choose the ones that age well.",
    image: "alibaug-villa/detail",
  },
  {
    title: "Seen before built",
    text: "You will walk through your project in 3D before a single order is placed. No surprises on site.",
    image: "alwarpet-loft/detail",
  },
];

export const industries = [
  "Private residences",
  "Holiday homes",
  "Workplaces",
  "Fashion retail",
  "Restaurants & bars",
  "Boutique hotels",
  "Clinics & wellness",
  "Show apartments",
];

export const processSteps = [
  {
    title: "Discover",
    text: "We visit, measure and listen. You tell us how you live, what you own and what you would never part with.",
  },
  {
    title: "Concept",
    text: "Plans, palettes and references come together in a single concept presentation for your sign-off.",
  },
  {
    title: "3D Visualize",
    text: "The whole design is modelled in real time. Change a wall colour or a sofa and see it immediately.",
  },
  {
    title: "Execute",
    text: "Our project team runs the site: contractors, deliveries, quality checks and a weekly report.",
  },
  {
    title: "Handover",
    text: "We style every shelf, walk you through the finished rooms and return after twelve months.",
  },
];
