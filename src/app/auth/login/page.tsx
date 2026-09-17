import { redirect } from "next/navigation";

/**
 * Email/password login removed. BOARD is wallet-only.
 */
export default function AuthLoginPage() {
  redirect("/account");
}
