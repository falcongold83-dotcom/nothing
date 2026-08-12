// service-worker.js
// Place at the SITE ROOT (e.g. https://notinglab1.com/service-worker.js)
// so its scope covers the whole site.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "NOTHING", body: "Nothing happened." };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // If parsing fails, fall back to the default above. Even the failure
    // case here is, appropriately, nothing.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "NOTHING", {
      body: data.body || "Nothing happened.",
      // Deliberately no icon/badge/image/actions/vibrate.
      // No unread badge count either — nothing to accumulate.
      silent: false,
      tag: "nothing", // reuses the same notification slot; no stacking
    })
  );
});

// Clicking the notification does not open the site or navigate anywhere.
// It just closes. There is nowhere it is trying to send you.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
});
