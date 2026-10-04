const CACHE_NAME = "arista-v2.1";
const urlsToCache = [
	"/favicon.png",
	"/favicon-192x192.png",
	"/apple-touch-icon-180x180.png",
	"/apple-touch-icon-152x152.png",
	"/apple-touch-icon-167x167.png",
	"/manifest.json"
];

// Install event - cache resources
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		})
	);
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);
	const isSameOrigin = url.origin === self.location.origin;
	const isBuiltAsset =
		url.pathname.startsWith("/_app/") ||
		url.pathname.startsWith("/icons/") ||
		["font", "image", "manifest"].includes(event.request.destination);

	// Never cache navigations or API responses. They can contain account-specific data.
	// Exclude Vite's development modules. Caching them makes hot updates appear stale.
	if (!isSameOrigin || !isBuiltAsset) return;

	event.respondWith(
		caches.match(event.request).then(async (cachedResponse) => {
			if (cachedResponse) return cachedResponse;
			const response = await fetch(event.request);
			if (response.ok) {
				const cache = await caches.open(CACHE_NAME);
				cache.put(event.request, response.clone());
			}
			return response;
		})
	);
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							return caches.delete(cacheName);
						}
					})
				);
			}),
			self.clients.claim()
		])
	);
});
