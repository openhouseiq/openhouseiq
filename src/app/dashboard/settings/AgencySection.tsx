import Link from "next/link";

export function AgencySection({
  membership,
}: {
  membership: { agencyName: string; isOwner: boolean } | null;
}) {
  if (membership) {
    return (
      <p className="text-sm text-ink">
        {membership.isOwner ? "You manage" : "You're part of"}{" "}
        <strong>{membership.agencyName}</strong>&apos;s agency plan.{" "}
        <Link href="/dashboard/agency" className="text-brass underline">
          {membership.isOwner ? "Manage agency" : "View agency"}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-soft">
        Running a team? One subscription can cover your whole agency, with
        volume discounts as you add agents.
      </p>
      <Link href="/dashboard/agency" className="text-sm text-brass underline">
        Set up an agency plan
      </Link>
    </div>
  );
}
