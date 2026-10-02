import { redirect } from "next/navigation";

// The backend has no public site; the root goes to moderation.
export default function Home() {
  redirect("/admin");
}
