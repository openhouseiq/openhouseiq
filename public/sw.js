// Minimal service worker: no offline caching, just enough of a fetch
// handler for browsers to consider the app installable ("Add to Home
// Screen"). Every request just goes straight to the network.
self.addEventListener("fetch", () => {});
