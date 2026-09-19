import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireAccount } from "@/server/queries/auth";
import { listMembers } from "@/server/queries/members";
import { MemberForm } from "@/features/members/member-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Members" };
export default async function MembersPage() {
  const account = await requireAccount();
  const members = await listMembers();
  const admin = account.role === "admin";
  const activeCount = members.filter((member) => member.active).length;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-primary text-xs font-bold tracking-widest uppercase">
          Our circle
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          Our shared roster, saved to the database. These are the friends in our
          circle, separate from the two login accounts.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge>{activeCount} active</Badge>
          <Badge variant="outline">
            {members.length - activeCount} inactive
          </Badge>
        </div>
      </header>
      {admin && (
        <section
          className="bg-card space-y-4 rounded-xl border p-5 sm:p-6"
          aria-labelledby="add-member-heading"
        >
          <h2 id="add-member-heading" className="text-lg font-semibold">
            Add a member
          </h2>
          <MemberForm />
        </section>
      )}
      {members.length === 0 ? (
        <section className="bg-card rounded-xl border border-dashed p-8 text-center">
          <Users
            aria-hidden="true"
            className="text-primary mx-auto mb-3 size-8"
          />
          <h2 className="text-lg font-semibold">No members added yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {admin
              ? "Add the real names of the friends in your circle above."
              : "The administrator will add the circle’s roster here."}
          </p>
        </section>
      ) : (
        <ul className="space-y-3" aria-label="Circle members">
          {members.map((member) => (
            <li key={member.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 text-base font-semibold break-words">
                  {member.full_name}
                </h2>
                <Badge variant={member.active ? "secondary" : "outline"}>
                  {member.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {admin && (
                <details className="mt-3">
                  <summary className="focus-ring text-primary flex min-h-11 cursor-pointer items-center rounded-md text-sm font-semibold">
                    Edit member
                  </summary>
                  <div className="border-t pt-4">
                    <MemberForm member={member} />
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-muted-foreground text-xs leading-relaxed">
        Inactive members remain in the roster to preserve their identity and
        history. Cycle setup, winner history, and payments will follow in later
        features. The dashboard still shows fictional sample data.
      </p>
    </div>
  );
}
