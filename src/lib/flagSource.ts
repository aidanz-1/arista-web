import { format } from "date-fns";

/** "Flagged by Mekot Sarder on Oct 10" or "Flagged automatically", for review pages. */
export function flagSource(
	session: {
		flaggedBy?: string;
		flaggedAt?: string;
		durationWarningReason?: string;
	},
	flaggedByName: string
) {
	const when = session.flaggedAt ? ` on ${format(new Date(session.flaggedAt), "MMM d")}` : "";
	if (session.flaggedBy)
		return `Flagged by ${flaggedByName || "a reviewer who no longer has an account"}${when}`;
	// Flags from before reviewers were recorded have no author; the site's own
	// flags start with this wording.
	if (session.flaggedAt || session.durationWarningReason?.startsWith("Tutee submitted"))
		return `Flagged automatically${when}`;
	return "Flagged by a reviewer (name not recorded)";
}
