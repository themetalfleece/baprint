import { respondWithThirdPartyLicenses } from "@/features/army-list/server/thirdPartyLicensesRoute";

// Built once into a static file, so the server never reads node_modules at runtime.
export const dynamic = "force-static";

export function GET(): Promise<Response> {
  return respondWithThirdPartyLicenses();
}
