import { redirect } from "next/navigation";

/** Old wallet page removed. Balance lives in the profile menu. */
export default function WalletRedirectPage() {
  redirect("/");
}
