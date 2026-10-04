export function getSafeRedirectTarget(redirectTo: string | null, origin: string): string {
	if (!redirectTo) {
		return "/";
	}

	try {
		const target = new URL(redirectTo, origin);
		if (target.origin !== origin) {
			return "/";
		}

		return `${target.pathname}${target.search}${target.hash}`;
	} catch {
		return "/";
	}
}
