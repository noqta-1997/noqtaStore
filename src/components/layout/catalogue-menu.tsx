"use client";

import {
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";

import { MenuLink } from "@/components/layout/menu-link";
import type { CatalogueMenu as CatalogueMenuModel, MenuBranch } from "@/lib/category-menu";
import { cn } from "@/lib/utils";

interface CatalogueMenuProps {
  menu: CatalogueMenuModel;
  /** "كل {name}" — the first item of every submenu, leading to the branch itself. */
  wholeLabel: string;
  /** The classes the plain nav links wear, so the trigger reads as one of them. */
  linkClassName: string;
}

/**
 * A branch as a menu entry. One with nothing under it is a plain link; one
 * with branches under it opens a submenu on hover or on the arrow key, whose
 * first item is the branch itself and the rest its children — recursively,
 * so a stage opens on its grades and a preparatory grade on its two halves,
 * and a level added later opens the same way.
 */
function BranchEntry({ branch, wholeLabel }: { branch: MenuBranch; wholeLabel: string }) {
  if (!branch.children.length) {
    return <MenuLink href={branch.href}>{branch.name}</MenuLink>;
  }

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuItem>{branch.name}</MenuItem>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuLink href={branch.href}>{wholeLabel.replace("{name}", branch.name)}</MenuLink>
          <MenuDivider />
          {branch.children.map((child) => (
            <BranchEntry key={child.id} branch={child} wholeLabel={wholeLabel} />
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

/**
 * The catalogue's tree as a cascading menu under its nav item: a click opens
 * the stages, each stage opens on its grades, a grade with branches opens on
 * them. The first item leads to the whole listing, and the top-level branches
 * with nothing under them — the genres the store opened with — are grouped at
 * the end under their own heading.
 *
 * Fluent's Menu does the work the pattern calls for: arrow keys walk the
 * items and open submenus in the reading direction, Escape closes a level
 * and hands focus back, and the submenus are placed on the side the text
 * runs toward. The header row has no width to spare, so there is no chevron
 * on the trigger; the open state is drawn on it instead.
 */
export function CatalogueMenu({ menu, wholeLabel, linkClassName }: CatalogueMenuProps) {
  return (
    <Menu positioning="below-start">
      <MenuTrigger disableButtonEnhancement>
        <button
          type="button"
          className={cn(linkClassName, "aria-expanded:bg-state-hover aria-expanded:text-on-surface")}
        >
          {menu.label}
        </button>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuLink href={menu.href}>{menu.allLabel}</MenuLink>
          <MenuDivider />

          {menu.columns.map((branch) => (
            <BranchEntry key={branch.id} branch={branch} wholeLabel={wholeLabel} />
          ))}

          {menu.others.length ? (
            <>
              <MenuDivider />
              <MenuGroup>
                <MenuGroupHeader>{menu.othersLabel}</MenuGroupHeader>
                {menu.others.map((branch) => (
                  <MenuLink key={branch.id} href={branch.href}>
                    {branch.name}
                  </MenuLink>
                ))}
              </MenuGroup>
            </>
          ) : null}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
