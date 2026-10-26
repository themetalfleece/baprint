import { SOCIAL_CARD_SIZE } from "@/features/army-list/components/SocialCard";
import {
  renderListSocialImage,
  SOCIAL_IMAGE_ALT,
} from "@/features/army-list/server/socialImage";

export const alt = SOCIAL_IMAGE_ALT;
export const size = SOCIAL_CARD_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage(props: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await props.params;

  return renderListSocialImage(listId);
}
