import type { Metadata } from "next";
import { ArmyListPage } from "@/features/army-list/components/ArmyListPage";
import { listPageMetadata } from "@/features/army-list/server/pageMetadata";

export async function generateMetadata(
  props: PageProps<"/list/[listId]">
): Promise<Metadata> {
  const { listId } = await props.params;

  return listPageMetadata(listId);
}

export default async function ListPage(props: PageProps<"/list/[listId]">) {
  const { listId } = await props.params;

  return <ArmyListPage listId={listId} />;
}
