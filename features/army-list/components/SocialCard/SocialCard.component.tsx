import type { CSSProperties } from "react";
import {
  SOCIAL_CARD_PALETTE as color,
  SOCIAL_CARD_SIZE,
} from "./SocialCard.constants";
import type { SocialCardProps, SocialCardTile } from "./SocialCard.types";

/** The longest kicker and heading that fit one and two lines. */
const MAX_KICKER_LENGTH = 56;
const MAX_HEADING_LENGTH = 60;
const LONG_HEADING_LENGTH = 26;

/**
 * The link preview image, in the hero's olive and gold. It is drawn by
 * `next/og`, which takes inline styles only and lays out with flexbox, so
 * every element with more than one child sets `display: flex`.
 */
export function SocialCard({ kicker, heading, tiles }: SocialCardProps) {
  const text = clip(heading, MAX_HEADING_LENGTH);

  return (
    <div style={styles.card}>
      <div style={styles.stripe} />
      <div style={styles.masthead}>
        <span style={styles.wordmark}>baprint</span>
        <span style={styles.tagline}>Bolt Action list printer</span>
      </div>
      <div style={styles.titles}>
        <span style={styles.kicker}>{clip(kicker, MAX_KICKER_LENGTH)}</span>
        <span
          style={{
            ...styles.heading,
            fontSize: text.length > LONG_HEADING_LENGTH ? 68 : 88,
          }}
        >
          {text}
        </span>
      </div>
      <div style={styles.tiles}>
        {tiles.map((tile) => (
          <Tile key={tile.label} tile={tile} />
        ))}
      </div>
    </div>
  );
}

function Tile({ tile }: { tile: SocialCardTile }) {
  if (tile.value === undefined) {
    return (
      <div style={styles.tile}>
        <span style={styles.feature}>{tile.label}</span>
      </div>
    );
  }

  return (
    <div style={styles.tile}>
      <span style={styles.value}>{tile.value}</span>
      <span style={styles.label}>{tile.label}</span>
    </div>
  );
}

/** Cuts long text at a word and ends it with an ellipsis. */
function clip(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

const styles = {
  card: {
    ...SOCIAL_CARD_SIZE,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    padding: "64px 80px 72px 96px",
    backgroundColor: color["--ds-chrome-hero"],
    color: color["--ds-chrome-hero-text"],
  },
  stripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 16,
    backgroundColor: color["--ds-chrome-highlight"],
  },
  masthead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  wordmark: { fontSize: 40, letterSpacing: -1 },
  tagline: {
    fontSize: 22,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: color["--ds-chrome-hero-muted"],
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    marginTop: "auto",
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 5,
    textTransform: "uppercase",
    color: color["--ds-chrome-highlight"],
  },
  heading: { marginTop: 16, lineHeight: 1.05, letterSpacing: -2 },
  tiles: { display: "flex", gap: 20, marginTop: 48 },
  tile: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    minHeight: 132,
    padding: "20px 28px",
    borderRadius: 16,
    border: `2px solid ${color["--ds-chrome-accent"]}`,
    backgroundColor: color["--ds-chrome-accent-strong"],
  },
  value: { fontSize: 56, lineHeight: 1 },
  label: {
    marginTop: 10,
    fontSize: 20,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: color["--ds-chrome-hero-muted"],
  },
  feature: { fontSize: 25, lineHeight: 1.2 },
} satisfies Record<string, CSSProperties>;
