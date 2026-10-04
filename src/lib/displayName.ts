type Named = { name?: string; preferredName?: string } | null | undefined;

/** The name someone goes by: their preferred name, or their legal first name. */
export function firstName(person: Named): string {
	return person?.preferredName?.trim() || person?.name?.trim().split(/\s+/)[0] || "";
}

/** Full name for display, with the preferred name in place of the legal first name. */
export function displayName(person: Named): string {
	const legal = person?.name?.trim() ?? "";
	const preferred = person?.preferredName?.trim();
	if (!preferred) return legal;
	const rest = legal.split(/\s+/).slice(1).join(" ");
	return rest ? `${preferred} ${rest}` : preferred;
}

export function initials(person: Named): string {
	return displayName(person)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}
