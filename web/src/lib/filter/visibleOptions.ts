export function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export function getVisibleOptions(opts: {
  group: string;
  allOptions: string[];
  selected: string[];
  expanded: boolean;
  topFilters?: Record<string, string[]>;
  collapsedLimit?: number; // default 10
  topLimit?: number;       // default 8
}) {
  const {
    group,
    allOptions,
    selected,
    expanded,
    topFilters,
    collapsedLimit = 10,
    topLimit = 8,
  } = opts;

  if (expanded) {
    return uniq([...selected, ...allOptions]);
  }

  const top = topFilters?.[group] ?? allOptions.slice(0, topLimit);
  return uniq([...selected, ...top]).slice(0, collapsedLimit);
}