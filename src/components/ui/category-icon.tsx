import {
  Atom,
  BookOpen,
  BrainCircuit,
  Feather,
  Landmark,
  Sprout,
  ToyBrick,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/** Category data stores an icon name; the UI layer owns the mapping. */
const icons: Record<string, LucideIcon> = {
  Atom,
  BookOpen,
  BrainCircuit,
  Feather,
  Landmark,
  Sprout,
  ToyBrick,
  UserRound,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = icons[name] ?? BookOpen;
  return <Icon aria-hidden className={className} strokeWidth={1.75} />;
}
