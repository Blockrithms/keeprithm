"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Input, Label, Button } from "~/components/ui";
import {
  FormError,
  PasswordInput,
  SlackButton,
  LoadingSpinner,
} from "~/components/common";
import { login } from "@/services/auth";

const URL_ERRORS: Record<string, string> = {
  slack_failed: "Slack sign-in failed. Please try again.",
  slack_cancelled: "Slack authorization was cancelled.",
  state_mismatch:
    "Your Slack authorization session expired or was started from a different URL. Please try again.",
  slack_exchange_failed:
    "Could not complete Slack sign-in with the server. Please try again.",
  workspace_install_failed:
    "Could not install the Slack workspace. Please try again.",
  not_primary_owner:
    "Only the Primary Workspace Owner can install a Slack workspace.",
  workspace_not_allowed:
    "This Slack workspace is not permitted on this deployment.",
  account_restricted: "Your account has been restricted.",
  slack_misconfigured: "Slack OAuth is not configured on the client.",
};

type LoginFormProps = {
  errorCode?: string;
};

export default function LoginForm({ errorCode }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(
    () => URL_ERRORS[errorCode ?? ""] ?? null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setErrors({});

    const newErrors: Record<string, string[]> = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = ["Invalid email address"];
    }
    if (!password || password.length < 6) {
      newErrors.password = ["Invalid password"];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({ email, password });
      if (res?.user?.role === "admin" || res?.data?.user?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/workspace");
      }
      router.refresh();
    } catch (err: any) {
      setAuthError(
        err?.response?.data?.message || err?.message || "Invalid credentials"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 mb-3">
        {authError && <Alert variant="destructive">{authError}</Alert>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            name="email"
            id="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormError errors={errors} field="email" />
        </div>
        <PasswordInput
          name="password"
          label="Password"
          errors={errors}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner /> : "Login"}
        </Button>
      </form>
      <SlackButton title="Sign in with Slack" state="signin" />
    </>
  );
}
