import { SOCIAL_CARD_SIZE } from "@/features/army-list/components/SocialCard";
import {
  renderHomeSocialImage,
  SOCIAL_IMAGE_ALT,
} from "@/features/army-list/server/socialImage";

export const alt = SOCIAL_IMAGE_ALT;
export const size = SOCIAL_CARD_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderHomeSocialImage();
}
