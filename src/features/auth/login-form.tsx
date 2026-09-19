"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Info, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signIn } from "@/server/actions/auth";

type Errors = { username?: string | undefined; password?: string | undefined };

export function LoginForm({ admin = false }: { admin?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, action, pending] = useActionState(signIn.bind(null, admin), {
    error: "",
  });
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const prefix = admin ? "admin" : "member";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: Errors = {};
    if (!usernameRef.current?.value.trim())
      nextErrors.username = "Enter your username.";
    if (!passwordRef.current?.value)
      nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) {
      event.preventDefault();
      if (nextErrors.username) usernameRef.current?.focus();
      else passwordRef.current?.focus();
    }
    setShowPassword(false);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      action={action}
      aria-busy={pending}
      className="space-y-5"
      aria-describedby={`${prefix}-preview-note`}
    >
      <div>
        <label
          htmlFor={`${prefix}-username`}
          className="mb-2 block text-sm font-semibold"
        >
          {admin ? "Administrator username" : "Circle username"}
        </label>
        <div className="relative">
          <UserRound
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-4 left-3.5 size-4"
          />
          <Input
            ref={usernameRef}
            id={`${prefix}-username`}
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={
              admin
                ? "Enter administrator username"
                : "Enter the shared member username"
            }
            className="pl-10"
            required
            aria-invalid={Boolean(errors.username)}
            aria-describedby={
              errors.username ? `${prefix}-username-error` : undefined
            }
            onChange={() => {
              setErrors((current) => ({ ...current, username: undefined }));
            }}
          />
        </div>
        {errors.username && (
          <p
            id={`${prefix}-username-error`}
            className="text-destructive mt-2 text-xs"
            role="alert"
          >
            {errors.username}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor={`${prefix}-password`}
          className="mb-2 block text-sm font-semibold"
        >
          Password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-4 left-3.5 size-4"
          />
          <Input
            ref={passwordRef}
            id={`${prefix}-password`}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pr-12 pl-10"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? `${prefix}-password-error` : undefined
            }
            onChange={() => {
              setErrors((current) => ({ ...current, password: undefined }));
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground absolute top-0.5 right-0.5 size-11"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls={`${prefix}-password`}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p
            id={`${prefix}-password-error`}
            className="text-destructive mt-2 text-xs"
            role="alert"
          >
            {errors.password}
          </p>
        )}
      </div>
      <p
        id={`${prefix}-preview-note`}
        className="text-muted-foreground text-xs leading-relaxed"
      >
        Access is limited to our circle’s existing accounts. Contact the
        administrator if you need help signing in.
      </p>
      <Button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full gap-2 text-sm font-semibold"
      >
        {pending
          ? "Signing in…"
          : admin
            ? "Administrator sign-in"
            : "Member sign-in"}
        <LockKeyhole aria-hidden="true" />
      </Button>
      {state.error && (
        <div
          role="alert"
          className="bg-secondary text-secondary-foreground flex gap-2 rounded-lg p-3 text-xs leading-relaxed"
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}
    </form>
  );
}
