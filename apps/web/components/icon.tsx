import {
  BadgeCheck,
  BrainCircuit,
  Compass,
  Eye,
  Feather,
  Fingerprint,
  Flame,
  Flower2,
  HandHeart,
  Hash,
  Heart,
  HeartHandshake,
  Hourglass,
  Layers,
  Leaf,
  Lock,
  MessageCircleHeart,
  MoonStar,
  Orbit,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Users,
  UserRoundCheck,
  type LucideProps,
} from "lucide-react";

/** Maps the icon names used in `lib/content/site.ts` to lucide components. */
const registry = {
  BadgeCheck,
  BrainCircuit,
  Compass,
  Eye,
  Feather,
  Fingerprint,
  Flame,
  Flower2,
  HandHeart,
  Hash,
  Heart,
  HeartHandshake,
  Hourglass,
  Layers,
  Leaf,
  Lock,
  MessageCircleHeart,
  MoonStar,
  Orbit,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Users,
  UserRoundCheck,
} as const;

export type IconName = keyof typeof registry;

const isKnown = (name: string): name is IconName => name in registry;

/**
 * Icon names also arrive from the database (a service picks one in the
 * admin), so an unknown name falls back to Sparkles instead of crashing the
 * page that renders it.
 */
export function Icon({
  name,
  ...props
}: { name: IconName | string } & LucideProps) {
  const Cmp = isKnown(name) ? registry[name] : Sparkles;
  return <Cmp {...props} />;
}
