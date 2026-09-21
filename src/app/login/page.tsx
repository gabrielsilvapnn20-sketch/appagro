import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
