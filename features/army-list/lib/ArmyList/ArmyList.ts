import { ListParseError } from "@/features/army-list/lib/ListParseError";
import { Platoon } from "@/features/army-list/lib/Platoon";
import { isRecord, readCount, readText } from "@/lib/wireValues";
import type { PickListItem } from "./ArmyList.types";

interface ArmyListOptions {
  points: number;
  orderDice: number;
  platoons: readonly Platoon[];
  pickList: readonly PickListItem[];
}

/**
 * A Bolt Action army list as EasyArmy exports it, normalised: string numbers
 * and booleans are read into real ones and field spelling differences are
 * smoothed over, so rendering code never sees the wire format.
 */
export class ArmyList {
  /** The list's total points as EasyArmy reports them. */
  readonly points: number;
  /** The list's order dice as EasyArmy reports them. */
  readonly orderDice: number;
  readonly platoons: readonly Platoon[];
  readonly pickList: readonly PickListItem[];

  constructor(options: ArmyListOptions) {
    this.points = options.points;
    this.orderDice = options.orderDice;
    this.platoons = options.platoons;
    this.pickList = options.pickList;
  }

  /** The countries the pick list draws from, in first-seen order. */
  get countries(): readonly string[] {
    const countries = this.pickList
      .map((item) => item.country)
      .filter((country) => country !== "");

    return [...new Set(countries)];
  }

  /** A name for the list, used as the page title so a saved PDF is named after it. */
  get title(): string {
    return [
      "Bolt Action army list",
      ...this.countries,
      `${this.points} pts`,
    ].join(", ");
  }

  /** How many units the list holds across all platoons. */
  get unitCount(): number {
    return this.platoons.reduce(
      (total, platoon) => total + platoon.units.length,
      0
    );
  }

  /**
   * Builds a list from decoded EasyArmy JSON. Totals the list leaves out are
   * worked out from the platoons.
   *
   * @throws ListParseError when the data is not an EasyArmy list.
   */
  static fromWire(data: unknown): ArmyList {
    if (!isRecord(data) || !Array.isArray(data.Platoons)) {
      throw new ListParseError(
        "That JSON is not an EasyArmy list: it has no Platoons."
      );
    }

    const platoons = data.Platoons.map((platoon, index) =>
      Platoon.fromWire(platoon, { id: `platoon-${index + 1}` })
    );
    const pickList = Array.isArray(data.PickList)
      ? data.PickList.filter(isRecord).map(ArmyList.#readPickListItem)
      : [];

    return new ArmyList({
      points: ArmyList.#readTotal({
        reported: data.TotalPoints,
        platoons,
        of: (platoon) => platoon.points,
      }),
      orderDice: ArmyList.#readTotal({
        reported: data.OrderDice,
        platoons,
        of: (platoon) => platoon.orderDice,
      }),
      platoons,
      pickList,
    });
  }

  static #readPickListItem(
    record: Record<string, unknown>,
    index: number
  ): PickListItem {
    return {
      id: `pick-${index + 1}`,
      country: readText(record.Country),
      item: readText(record.Item),
      quantity: readCount(record.Quantity) ?? 0,
    };
  }

  static #readTotal(options: {
    reported: unknown;
    platoons: readonly Platoon[];
    of: (platoon: Platoon) => number;
  }): number {
    const reported = readCount(options.reported);

    if (reported !== null) {
      return reported;
    }

    return options.platoons.reduce(
      (total, platoon) => total + options.of(platoon),
      0
    );
  }
}
