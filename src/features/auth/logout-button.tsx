"use client";

import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [state, action, pending] = useActionState(signOut, { error: "" });
  return (
    <form action={action}>
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        className="min-h-11"
      >
        <LogOut aria-hidden="true" />
        {pending ? "Signing out…" : "Sign out"}
      </Button>
      {state.error && (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
