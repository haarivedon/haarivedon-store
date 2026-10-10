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

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = registry[name];
  return <Cmp {...props} />;
}
