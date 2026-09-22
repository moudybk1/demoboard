import { redirect } from "next/navigation";

/** Old wins page removed. History lives in the profile menu. */
export default function WinsRedirectPage() {
  redirect("/play/history");
}
