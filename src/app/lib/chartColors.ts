// Editorial chart palette — reads the live CSS custom properties so recharts
// (and any other chart lib) follows the paper/ink/clay theme and flips with dark
// mode. Call inside a component (optionally keyed on the theme) so values refresh
// when the `.dark` class toggles on <html>.
export function chartColors() {
  const read = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };
  return {
    clay: read('--clay', '#b5613d'),
    clayDeep: read('--clay-deep', '#8c4a2f'),
    ink: read('--ink', '#16140f'),
    ink2: read('--ink-2', '#6b655c'),
    line: read('--line', '#dad3c8'),
    paper: read('--paper', '#f6f3ee'),
    paper2: read('--paper-2', '#ece7df'),
    // Muted semantic accents that still sit in the warm palette.
    positive: '#5c7f5c',
    warning: '#c98a2e',
    danger: '#b5493d',
  };
}

export type ChartColors = ReturnType<typeof chartColors>;
