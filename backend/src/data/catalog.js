/** Shared catalog used by API routes and booking validation */

export const VISIT_FEE_PAISE = 19900;
export const VISIT_FEE_DISPLAY = '₹199';

export const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

export const LOCATIONS = [
  'Hyderabad, Telangana',
  'Bengaluru, Karnataka',
  'Chennai, Tamil Nadu',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'Delhi NCR',
  'Ahmedabad, Gujarat',
  'Kolkata, West Bengal',
];

export const PROPERTY_TYPES = [
  'Independent House',
  'Apartment / Flat',
  'Villa',
  'Plot / Under Construction',
  'Commercial',
];

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', description: 'GPay, PhonePe, Paytm & more' },
  { id: 'card', label: 'Debit / Credit Card', description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', description: 'All major Indian banks' },
];

export const SERVICES = [
  {
    id: 'complete-house',
    name: 'Complete House Building',
    short: 'Turnkey construction from plan to handover',
    tagline: 'New construction',
    category: 'build',
    visitFeePaise: VISIT_FEE_PAISE,
    visitFeeDisplay: VISIT_FEE_DISPLAY,
    desc: 'End-to-end house construction with expert planning, structural work, and quality finishing. Ideal for new builds on plots or redevelopment projects.',
    includes: [
      'Site survey & feasibility assessment',
      'Structural & layout consultation',
      'Budget estimation for full build',
      'Material & timeline guidance',
    ],
  },
  {
    id: 'tiles-flooring',
    name: 'Tiles & Flooring Work',
    short: 'Premium flooring, tiles & marble installation',
    tagline: 'Build & repair',
    category: 'both',
    visitFeePaise: VISIT_FEE_PAISE,
    visitFeeDisplay: VISIT_FEE_DISPLAY,
    desc: 'Professional tile laying, marble/granite work, vinyl & wooden flooring for new homes or renovations.',
    includes: [
      'Floor condition assessment',
      'Material quantity estimate',
      'Design & layout suggestions',
      'Labour & cost breakdown',
    ],
  },
  {
    id: 'painting',
    name: 'Home Painting / Color Work',
    short: 'Interior & exterior painting professionals',
    tagline: 'Build & repair',
    category: 'both',
    visitFeePaise: VISIT_FEE_PAISE,
    visitFeeDisplay: VISIT_FEE_DISPLAY,
    desc: 'Interior and exterior painting with surface prep guidance, color consultation, and durable finishes.',
    includes: [
      'Wall condition inspection',
      'Paint type & quantity estimate',
      'Color & finish recommendations',
      'Labour & materials quote',
    ],
  },
  {
    id: 'plumbing',
    name: 'Plumbing Services',
    short: 'Leaks, fittings, bathrooms & pipelines',
    tagline: 'Repairs & installs',
    category: 'repair',
    visitFeePaise: VISIT_FEE_PAISE,
    visitFeeDisplay: VISIT_FEE_DISPLAY,
    desc: 'Expert plumbing for leaks, blockages, bathroom fittings, water tanks, and new pipeline layouts.',
    includes: [
      'Leak & pressure diagnosis',
      'Fixture & pipe assessment',
      'Repair vs replace advice',
      'Itemized service estimate',
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical Services',
    short: 'Wiring, switches, lighting & safety checks',
    tagline: 'Repairs & installs',
    category: 'repair',
    visitFeePaise: VISIT_FEE_PAISE,
    visitFeeDisplay: VISIT_FEE_DISPLAY,
    desc: 'Safe electrical work including wiring, DB panels, switches, lighting, and load assessment.',
    includes: [
      'Safety & load assessment',
      'Wiring & fixture inspection',
      'Upgrade recommendations',
      'Transparent labour estimate',
    ],
  },
];

export function getServiceById(id) {
  return SERVICES.find((s) => s.id === id) || null;
}
