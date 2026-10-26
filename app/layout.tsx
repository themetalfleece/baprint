import type { Metadata } from "next";
import "@/components/ui/tokens.css";
import "@/components/ui/reset.css";
import { siteMetadata } from "@/features/army-list/server/pageMetadata";
import styles from "./layout.module.css";

export function generateMetadata(): Promise<Metadata> {
  return siteMetadata();
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
