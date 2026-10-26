/** The size link previews are drawn at, the 1.91:1 Open Graph shape. */
export const SOCIAL_CARD_SIZE = { width: 1200, height: 630 } as const;

/**
 * The screen chrome colours from `components/ui/tokens.css`. The card is drawn
 * outside the browser and cannot read CSS variables, so it copies them; a test
 * keeps the two in step.
 */
export const SOCIAL_CARD_PALETTE = {
  "--ds-chrome-hero": "#22271a",
  "--ds-chrome-hero-text": "#f4f0e3",
  "--ds-chrome-hero-muted": "#c3bfa9",
  "--ds-chrome-highlight": "#c9b26b",
  "--ds-chrome-accent": "#4a5a2a",
  "--ds-chrome-accent-strong": "#36421d",
} as const;
