import "server-only";
import { EasyArmyClient } from "./EasyArmyClient";

/**
 * One client for the whole server, so the list route, page metadata and
 * preview images share its cache and throttle.
 */
export const sharedEasyArmyClient = new EasyArmyClient();
