import { ArmyListPage } from "@/features/army-list/components/ArmyListPage";
import { homeMetadata } from "@/features/army-list/server/pageMetadata";

export const metadata = homeMetadata;

export default function HomePage() {
  return <ArmyListPage />;
}
