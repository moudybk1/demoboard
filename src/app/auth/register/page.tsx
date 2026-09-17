import { redirect } from "next/navigation";

/**
 * Email/password register removed. BOARD is wallet-only.
 */
export default function AuthRegisterPage() {
  redirect("/account");
}
