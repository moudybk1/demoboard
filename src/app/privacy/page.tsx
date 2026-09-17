import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/layout/legal-document";
import { ProductShell } from "@/components/layout/product-shell";

export const metadata: Metadata = {
  title: "Privacy | BOARD",
  description:
    "Draft privacy policy for BOARD. Not yet written or in force.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "What is collected",
    covers:
      "The wallet address used to sign in, the session record (token hash, user agent, IP address, last seen), match history, and the ledger of deposits, entry fees, and payouts.",
  },
  {
    heading: "Why each item is held",
    covers:
      "The purpose and legal basis for each field above, separately. The IP address stored against a session needs its own justification.",
  },
  {
    heading: "What is public by design",
    covers:
      "On chain deposits, withdrawals, and burn proofs are public and permanent. A wallet address links a player's chain activity to their BOARD history, and that cannot be undone later.",
  },
  {
    heading: "How long it is kept",
    covers:
      "Retention for sessions, match history, and ledger rows, including whether financial records must be kept after an account is deleted.",
  },
  {
    heading: "Who else sees it",
    covers:
      "Every third party in the path: hosting, the database provider, the RPC endpoint, the chain indexer, WalletConnect, and any analytics.",
  },
  {
    heading: "Player rights",
    covers:
      "How to request an export, a correction, or deletion, what deletion can and cannot remove given the chain is public, and who to contact.",
  },
  {
    heading: "Cookies and local storage",
    covers:
      "The session cookie, what audio and display preferences are stored in the browser, and whether any of it is used for tracking.",
  },
];

export default function PrivacyPage() {
  return (
    <ProductShell accent="gold">
      <LegalDocument
        title="Privacy policy"
        intent="This policy will describe what BOARD collects when you connect a wallet and play, and what happens to it."
        sections={SECTIONS}
      />
    </ProductShell>
  );
}
