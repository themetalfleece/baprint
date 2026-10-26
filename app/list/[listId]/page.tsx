import { ArmyListPage } from "@/features/army-list/components/ArmyListPage";

export default async function ListPage(props: PageProps<"/list/[listId]">) {
  const { listId } = await props.params;

  return <ArmyListPage listId={listId} />;
}
