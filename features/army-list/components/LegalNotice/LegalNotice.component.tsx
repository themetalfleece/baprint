import styles from "./LegalNotice.module.css";

/** The site footer: says the app is unofficial and who owns the game content. */
export function LegalNotice() {
  return (
    <footer className={styles.notice}>
      <p>
        baprint is an unofficial fan tool. It is not affiliated with, endorsed
        by or sponsored by Warlord Games Ltd or EasyArmy.
      </p>
      <p>
        Bolt Action and Warlord Games are trademarks of Warlord Games Ltd. Unit
        names, points, stats and rule text belong to Warlord Games Ltd and are
        shown as EasyArmy provides them. You need the Bolt Action rulebooks to
        play.
      </p>
      <p>
        No accounts, cookies or analytics. A list you load is fetched from
        EasyArmy for that request only and is not stored.
      </p>
      <p>
        Built with open source software:{" "}
        <a href="/third-party-licenses.txt">third-party licences</a>.
      </p>
    </footer>
  );
}
