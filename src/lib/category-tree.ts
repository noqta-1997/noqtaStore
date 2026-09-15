/**
 * The category tables are adjacency lists — each row names its parent — and
 * they are small, so a page loads a whole tree once and answers every
 * question about it here, in memory: what hangs under a branch, what sits
 * above it, how deep it is.
 *
 * Both catalogues' trees go through these; nothing here knows which one it
 * is holding.
 */

export interface TreeRow {
  id: string;
  parentId: string | null;
}

export type TreeNode<T extends TreeRow> = T & {
  /** 0 for a top-level branch. */
  depth: number;
  children: TreeNode<T>[];
};

/**
 * The forest for a list of rows. Siblings keep the order the rows came in,
 * so the query decides it (sortOrder, then age). A row whose parent is not
 * in the list is treated as top-level rather than dropped.
 */
export function buildTree<T extends TreeRow>(rows: T[]): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>(
    rows.map((row) => [row.id, { ...row, depth: 0, children: [] }]),
  );
  const roots: TreeNode<T>[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const stamp = (list: TreeNode<T>[], depth: number) => {
    for (const node of list) {
      node.depth = depth;
      stamp(node.children, depth + 1);
    }
  };
  stamp(roots, 0);

  return roots;
}

/** Parents before children, siblings in order — the tree read as a list. */
export function flattenTree<T extends TreeRow>(roots: TreeNode<T>[]): TreeNode<T>[] {
  const out: TreeNode<T>[] = [];
  const walk = (list: TreeNode<T>[]) => {
    for (const node of list) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(roots);
  return out;
}

/** A branch and everything under it, itself first. */
export function subtreeOf<T extends TreeRow>(node: TreeNode<T>): TreeNode<T>[] {
  return flattenTree([node]);
}

/**
 * Adds the branches below into each branch's own figure, so a stage counts
 * every title of its grades. Mutates the nodes it is given and returns them.
 */
export function rollUp<T extends TreeRow, K extends keyof T>(
  roots: TreeNode<T>[],
  key: K & (T[K] extends number ? K : never),
): TreeNode<T>[] {
  const total = (node: TreeNode<T>): number => {
    const own = node[key] as number;
    const sum = node.children.reduce((acc, child) => acc + total(child), own);
    (node as Record<K, number>)[key] = sum;
    return sum;
  };
  roots.forEach(total);
  return roots;
}

/** The branches above a node, top-level first; empty for a top-level branch. */
export function ancestorsOf<T extends TreeRow>(
  node: TreeNode<T>,
  byId: Map<string, TreeNode<T>>,
): TreeNode<T>[] {
  const trail: TreeNode<T>[] = [];
  let current = node.parentId ? byId.get(node.parentId) : undefined;

  while (current) {
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return trail;
}

/**
 * Whether `candidateId` is `node` itself or sits anywhere under it — the
 * check that keeps a branch from being filed under its own descendant.
 */
export function isWithin<T extends TreeRow>(node: TreeNode<T>, candidateId: string): boolean {
  return subtreeOf(node).some((entry) => entry.id === candidateId);
}

/**
 * Leading space for a flat control — a select, a list — so that a branch
 * reads as sitting under the one above it. Non-breaking, or the browser
 * folds it away.
 */
export function indentFor(depth: number): string {
  return "   ".repeat(depth);
}
