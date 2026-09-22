import Link from "next/link";
import { LUDO_LAUNCH_RULES } from "@/lib/game/ludo-launch-rules";

export function LudoRulesContent() {
  return <section className="space-y-6 text-void">
    <header><h1 className="font-pixel text-2xl">BOARD Ludo · rules, fees and help</h1>
      <p className="mt-3">Read this ruleset before paying. Ludo variants differ; these are the rules for new BOARD paid rooms.</p></header>
    {LUDO_LAUNCH_RULES.map((rule) => <section key={rule.title}>
      <h2 className="font-pixel text-lg">{rule.title}</h2><p className="mt-2 leading-relaxed">{rule.text}</p>
    </section>)}
    <p><Link href="/play" className="underline">Ludo lobby</Link> · <Link href="/play/history" className="underline">My matches and refunds</Link></p>
  </section>;
}
