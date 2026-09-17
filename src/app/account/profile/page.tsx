import { redirect } from "next/navigation";

/**
 * Profile is the connected wallet. No separate email profile page.
 */
export default function AccountProfilePage() {
  redirect("/account");
}
