import type { ArmyList } from "@/features/army-list/lib/ArmyList";
import type { ListStat } from "./ListPreview.types";

const FALLBACK_HEADING = "Bolt Action army list";

/**
 * What a shared list link shows before it is opened: the page title and
 * description, and the heading and figures on its preview image.
 */
export class ListPreview {
  readonly #list: ArmyList;

  constructor(list: ArmyList) {
    this.#list = list;
  }

  /** The army's name, or a generic one when the player gave none. */
  get heading(): string {
    return this.#list.name === "" ? FALLBACK_HEADING : this.#list.name;
  }

  /** The countries the army draws from, such as "United States, Germany". */
  get countries(): string {
    return this.#list.countries.join(", ");
  }

  /** Such as "1000 GIs and Paras: United States, 998 pts". */
  get title(): string {
    const facts = [...this.#list.countries, `${this.#list.points} pts`];

    return `${this.heading}: ${facts.join(", ")}`;
  }

  get description(): string {
    const army = this.countries === "" ? "A" : `A ${this.countries}`;
    const figures = this.stats
      .map((stat) => `${stat.value} ${stat.label.toLowerCase()}`)
      .join(", ");

    return `${army} Bolt Action army list: ${figures}. Print it as a clean, black and grey sheet for the table.`;
  }

  /** The list's headline figures, in the order the preview shows them. */
  get stats(): readonly ListStat[] {
    const list = this.#list;

    return [
      { label: "Points", value: list.points },
      { label: "Order dice", value: list.orderDice },
      { label: "Platoons", value: list.platoons.length },
      { label: "Units", value: list.unitCount },
    ];
  }
}
