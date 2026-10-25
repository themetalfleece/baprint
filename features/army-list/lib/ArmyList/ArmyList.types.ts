/** One line of the list's pick list: how many of a model to bring. */
export interface PickListItem {
  /** Unique within the list, stable for a given input. */
  id: string;
  country: string;
  item: string;
  quantity: number;
}
