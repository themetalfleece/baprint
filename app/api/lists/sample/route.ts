import { respondWithSampleList } from "@/features/army-list/server/sampleListRoute";

// Built once into a static file, so the server never reads the fixtures at runtime.
export const dynamic = "force-static";

export function GET(): Promise<Response> {
  return respondWithSampleList();
}
