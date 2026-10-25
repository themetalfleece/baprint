import { SpecialRuleIndex } from "@/features/army-list/lib/SpecialRuleIndex";
import styles from "./ArmyListSheet.module.css";
import type { SpecialRulesSectionProps } from "./ArmyListSheet.types";

/** Every special rule in the list: its text, where to look it up and who has it. */
export function SpecialRulesSection({ rules }: SpecialRulesSectionProps) {
  if (rules.entries.length === 0) {
    return null;
  }

  return (
    <section className={styles.appendix}>
      <h2 className={styles.appendixHeading}>Special rules</h2>
      <dl className={styles.ruleList}>
        {rules.entries.map((rule) => (
          <div key={rule.label} className={styles.rule}>
            <dt className={styles.ruleName}>{rule.label}</dt>
            <dd className={styles.ruleReference}>
              {SpecialRuleIndex.formatReference(rule.reference)}
            </dd>
            {rule.descriptions.map((description) => (
              <dd key={description.name} className={styles.ruleText}>
                {description.name !== rule.label && (
                  <span className={styles.ruleVariant}>
                    {description.name}:{" "}
                  </span>
                )}
                {description.text}
              </dd>
            ))}
            <dd className={styles.ruleUsers}>{rule.usedBy.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
