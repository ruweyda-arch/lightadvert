import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const reason = typeof sp.reason === "string" ? sp.reason : undefined;
  const reset = sp.reset === "1";
  return <LoginForm reason={reason} reset={reset} />;
}
