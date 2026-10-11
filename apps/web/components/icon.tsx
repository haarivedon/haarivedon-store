import {
  BadgeCheck,
  Compass,
  Fingerprint,
  Flower2,
  HandHeart,
  Heart,
  Leaf,
  Lock,
  MessageCircleHeart,
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
  Compass,
  Fingerprint,
  Flower2,
  HandHeart,
  Heart,
  Leaf,
  Lock,
  MessageCircleHeart,
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
