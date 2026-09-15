import {
  Atom,
  Backpack,
  BookMarked,
  BookOpen,
  BrainCircuit,
  Calculator,
  Feather,
  FlaskConical,
  GraduationCap,
  Landmark,
  Languages,
  School,
  Sprout,
  ToyBrick,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/**
 * Category data stores an icon name; the UI layer owns the mapping. The
 * school ladder brought the stage and subject marks; the genres keep theirs.
 */
const icons: Record<string, LucideIcon> = {
  Atom,
  Backpack,
  BookMarked,
  BookOpen,
  BrainCircuit,
  Calculator,
  Feather,
  FlaskConical,
  GraduationCap,
  Landmark,
  Languages,
  School,
  Sprout,
  ToyBrick,
  UserRound,
};

/** Every name the map knows, for the panel's icon pickers. */
export const categoryIconNames = Object.keys(icons);

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = icons[name] ?? BookOpen;
  return <Icon aria-hidden className={className} strokeWidth={1.75} />;
}
