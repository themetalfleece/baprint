/** A tile along the card's foot: a figure with its label, or a label alone. */
export interface SocialCardTile {
  label: string;
  value?: number;
}

export interface SocialCardProps {
  /** The small line above the heading. */
  kicker: string;
  heading: string;
  tiles: readonly SocialCardTile[];
}
