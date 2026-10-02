import { login } from "../actions";
import { LoginForm } from "../small-forms";

export const metadata = { title: "Sign in · Around Nairobi admin" };

export default function LoginPage() {
  return (
    <main className="page">
      <h1 className="display">Around Nairobi</h1>
      <p className="lede">Moderation</p>
      <LoginForm action={login} />
    </main>
  );
}
