/** The part of a printed page inside its margins, in millimetres. */
export interface PageArea {
  widthMm: number;
  heightMm: number;
}

interface PrintFitOptions {
  area: PageArea;
  /** The smallest scale used. A block that needs less runs onto a second page. */
  minScale: number;
}

/** A fitted block's print style reads its scale from this custom property. */
export const PRINT_FIT_PROPERTY = "--print-fit";

const PX_PER_MM = 96 / 25.4;

/**
 * The scale that fits `heightPx` into `availablePx`, rounded down to two
 * places: 1 when it already fits, never below `minScale`.
 */
export function fitScale(
  heightPx: number,
  availablePx: number,
  minScale: number
): number {
  if (heightPx <= availablePx) {
    return 1;
  }

  return Math.max(minScale, Math.floor((availablePx / heightPx) * 100) / 100);
}

/**
 * Scales blocks down so each one prints on a single page. It lays the
 * container out at the page's width, measures every block and sets
 * `PRINT_FIT_PROPERTY` on the ones that are too tall.
 */
export class PrintFit {
  readonly #area: PageArea;
  readonly #minScale: number;

  constructor(options: PrintFitOptions) {
    this.#area = options.area;
    this.#minScale = options.minScale;
  }

  /** Sets the scale of each block in `container`, measured at the page's width. */
  apply(container: HTMLElement, blocks: readonly HTMLElement[]): void {
    this.clear(blocks);

    const screenWidth = container.style.width;
    container.style.width = `${this.#area.widthMm}mm`;
    const scales = blocks.map((block) => this.#measureScale(block));
    container.style.width = screenWidth;

    blocks.forEach((block, index) => {
      const scale = scales[index] ?? 1;

      if (scale < 1) {
        block.style.setProperty(PRINT_FIT_PROPERTY, String(scale));
      }
    });
  }

  /** Removes the scales `apply` set. */
  clear(blocks: readonly HTMLElement[]): void {
    for (const block of blocks) {
      block.style.removeProperty(PRINT_FIT_PROPERTY);
    }
  }

  /**
   * Zoom does not shrink every length exactly (thin borders and text round up
   * to whole pixels), so each guess is checked by zooming the block and
   * measuring it again, a step smaller until it fits.
   */
  #measureScale(block: HTMLElement): number {
    const availablePx = this.#area.heightMm * PX_PER_MM;
    const screenZoom = block.style.zoom;
    let scale = fitScale(
      block.getBoundingClientRect().height,
      availablePx,
      this.#minScale
    );

    while (scale < 1 && scale > this.#minScale) {
      block.style.zoom = String(scale);

      if (block.getBoundingClientRect().height <= availablePx) {
        break;
      }

      scale = Math.max(this.#minScale, Math.round(scale * 100 - 1) / 100);
    }

    block.style.zoom = screenZoom;
    return scale;
  }
}
