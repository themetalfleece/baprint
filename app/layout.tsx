import type { Metadata } from "next";
import "@/components/ui/tokens.css";
import "@/components/ui/reset.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "baprint: Bolt Action list printer",
  description:
    "Turn an EasyArmy Bolt Action list into a clean, black and grey sheet for the table.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
