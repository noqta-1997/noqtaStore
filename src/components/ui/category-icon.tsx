import Image from "next/image";
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
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Category data stores an icon name; the UI layer owns the mapping. The
 * pictures in `public/images/Icons/` are what the panel offers now, each named
 * after its file. The Lucide marks are what the seeded ladder and genres were
 * filed under; they stay drawable so those rows keep their look, but the
 * picker no longer offers them.
 */
const pictures = [
  "الكتاب",
  "اللغة العربية",
  "اللغة الانكليزية",
  "التربية الاسلامية",
  "الرياضيات",
  "الفيزياء",
  "الكيمياء",
  "الاحياء",
] as const;

const legacyIcons: Record<string, LucideIcon> = {
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
  Wrench,
};

/** Every name the panel's icon pickers offer. */
export const categoryIconNames: readonly string[] = pictures;

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  if (categoryIconNames.includes(name)) {
    return (
      <Image
        src={`/images/Icons/${name}.png`}
        alt=""
        aria-hidden
        width={64}
        height={64}
        className={cn("object-contain", className)}
      />
    );
  }
  const Icon = legacyIcons[name] ?? BookOpen;
  return <Icon aria-hidden className={className} strokeWidth={1.75} />;
}
