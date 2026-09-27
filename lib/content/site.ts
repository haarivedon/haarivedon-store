/**
 * Central content source for the marketing site.
 * Copy lives here so pages stay declarative and content is easy to hand back
 * to the client for edits. Icons are referenced by lucide-react name and
 * resolved in the components that render them.
 */

export const site = {
  name: "Haarivedon",
  tagline: "Wisdom · Guidance · Transformation",
  email: "hello@haarivedon.com",
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Courses", href: "/courses" },
  { label: "Products", href: "/products" },
  { label: "Predictions", href: "/predictions" },
  { label: "Blog", href: "/blog" },
] as const;

export const marqueeWords = [
  "Ancient Wisdom",
  "Personalized Guidance",
  "A Better Tomorrow",
] as const;

export const heroHighlights = [
  { icon: "Sprout", label: "Personal Guidance" },
  { icon: "Users", label: "One-on-One Sessions" },
  { icon: "BadgeCheck", label: "Trusted Expertise" },
] as const;

export const trustStrip = [
  { icon: "HandHeart", label: "Authentic Guidance" },
  { icon: "Lock", label: "Confidential Consultations" },
  { icon: "ScrollText", label: "Traditional Wisdom" },
  { icon: "Sun", label: "Positive Transformation" },
] as const;

export const aboutPillars = [
  {
    icon: "Heart",
    title: "Guidance with Compassion",
    description:
      "Every conversation begins with listening — without judgement, at your pace.",
  },
  {
    icon: "ScrollText",
    title: "Ancient Wisdom",
    description:
      "Time-honoured practices, interpreted for the questions you carry today.",
  },
  {
    icon: "Fingerprint",
    title: "Personalized Approach",
    description:
      "No two paths are alike. Your guidance is shaped around your life.",
  },
] as const;

export const services = [
  {
    icon: "MessageCircleHeart",
    title: "Personal Consultation",
    description:
      "Bring your questions and explore clear, personalized guidance for the decisions ahead.",
    href: "/services#consultation",
  },
  {
    icon: "Sparkles",
    title: "Prediction & Reading",
    description:
      "A dedicated reading based on your details, offering insight into what lies ahead.",
    href: "/predictions",
  },
  {
    icon: "Compass",
    title: "Guidance Sessions",
    description:
      "Focused support for specific areas of life — relationships, career, and beyond.",
    href: "/services#guidance",
  },
  {
    icon: "Flower2",
    title: "Spiritual Products",
    description:
      "Curated sacred objects chosen to support and steady your everyday practice.",
    href: "/products",
  },
] as const;

export const products = [
  {
    name: "Rudraksha Bracelet",
    price: 1499,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=640&q=80",
    alt: "Rudraksha bead bracelet resting on linen",
  },
  {
    name: "Shree Yantra",
    price: 2499,
    image:
      "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=640&q=80",
    alt: "Brass Shree Yantra with intricate geometry",
  },
  {
    name: "Herbal Healing Tea",
    price: 789,
    image:
      "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=640&q=80",
    alt: "Cup of herbal tea with fresh leaves",
  },
  {
    name: "Aroma Incense Set",
    price: 999,
    image:
      "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=640&q=80",
    alt: "Incense sticks and diffuser oils on a wooden tray",
  },
] as const;

export const whyPoints = [
  {
    icon: "ShieldCheck",
    title: "Authentic Guidance",
    description: "Rooted in traditional wisdom.",
  },
  {
    icon: "UserRoundCheck",
    title: "Personalized Approach",
    description: "Every journey is unique.",
  },
  {
    icon: "Lock",
    title: "Confidential & Safe",
    description: "Your privacy matters.",
  },
  {
    icon: "Leaf",
    title: "Holistic Support",
    description: "Mind · Body · Spirit.",
  },
] as const;

// Courses & mentorship offerings. Each banner is a self-contained graphic
// (title, blurb, and feature highlights are part of the image).
export const courses = [
  {
    title: "Reiki & Energy Healing",
    level: "Level 1 – Master",
    duration: "8 weeks",
    learners: "1,200+ learners",
    image: "/images/courses/reiki.jpg",
    alt: "Reiki & Energy Healing course — learn to channel and balance energy, with certification",
    href: "/courses/reiki",
  },
  {
    title: "Vedic Astrology Foundations",
    level: "Beginner friendly",
    duration: "10 weeks",
    learners: "900+ learners",
    image: "/images/courses/vedic-astrology.jpg",
    alt: "Vedic Astrology Foundations course — read a birth chart with confidence",
    href: "/courses/vedic-astrology",
  },
  {
    title: "Numerology & Vastu",
    level: "All levels",
    duration: "6 weeks",
    learners: "750+ learners",
    image: "/images/courses/numerology-vastu.jpg",
    alt: "Numerology & Vastu course — decode the numbers and spaces around you",
    href: "/courses/numerology-vastu",
  },
] as const;

// Sacred energy-tool categories, shown on the home page.
export const energyTools = [
  {
    name: "Gemstones",
    tagline: "Planetary Strength",
    description:
      "Certified stones matched to your birth chart to strengthen the planets that shape your path.",
    image: "/images/tools/gemstones.jpg",
    alt: "A collection of coloured gemstones on marble",
    href: "/products?category=gemstones",
  },
  {
    name: "Rudraksha",
    tagline: "Protection & Focus",
    description:
      "Sacred beads worn for centuries for protection, clarity, and a calmer, more grounded mind.",
    image: "/images/tools/rudraksha.jpg",
    alt: "A multi-faced rudraksha bead resting on marble",
    href: "/products?category=rudraksha",
  },
  {
    name: "Bracelets & Malas",
    tagline: "Everyday Intention",
    description:
      "Rudraksha and crystal bracelets and malas to carry your intention with you, every day.",
    image: "/images/tools/bracelets.jpg",
    alt: "Rudraksha mala and silver-accented bracelets",
    href: "/products?category=bracelets",
  },
  {
    name: "Crystal Trees",
    tagline: "Home & Workspace",
    description:
      "Handcrafted crystal trees that bring balancing energy and calm to your home or desk.",
    image: "/images/tools/crystal-trees.jpg",
    alt: "Crystal gemstone trees in amethyst, rose quartz and citrine",
    href: "/products?category=crystal-trees",
  },
] as const;

export const testimonials = [
  {
    name: "Priya Sharma",
    rating: 5,
    quote:
      "Neelam ji's guidance has brought so much clarity and peace into my life. I feel more confident and positive about my future.",
  },
  {
    name: "Rohit Verma",
    rating: 5,
    quote:
      "The personalized reading was incredibly accurate and insightful. I truly appreciate the compassion and wisdom.",
  },
  {
    name: "Anjali Mehta",
    rating: 5,
    quote:
      "A beautiful experience. Her guidance has helped me make important decisions with confidence.",
  },
] as const;

export const blogPosts = [
  {
    title: "Understanding Your Journey",
    excerpt:
      "How to read the quiet signals that point you toward your next step.",
    image:
      "https://images.unsplash.com/photo-1470137237906-d8a4f71e1966?auto=format&fit=crop&w=640&q=80",
    alt: "A pink lotus resting on still water",
    href: "/blog/understanding-your-journey",
  },
  {
    title: "Ancient Wisdom & Modern Life",
    excerpt:
      "Timeless practices, translated for the pace and pressures of today.",
    image:
      "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?auto=format&fit=crop&w=640&q=80",
    alt: "Fresh green seedlings reaching toward light",
    href: "/blog/ancient-wisdom-modern-life",
  },
  {
    title: "Finding Clarity in Uncertain Times",
    excerpt:
      "Simple ways to steady your mind when the path ahead feels unclear.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=640&q=80",
    alt: "Misty mountains at sunrise",
    href: "/blog/finding-clarity",
  },
] as const;
