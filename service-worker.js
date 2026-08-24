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
  let data = {
    title: "NOTHING",
    body: "Nothing happened.",
    actions: [{ action: "view", title: "Observe" }],
  };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // If parsing fails, fall back to the default above. Even the failure
    // case here is, appropriately, nothing.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "NOTHING", {
      body: data.body || "Nothing happened.",
      // Deliberately no icon/badge/image/vibrate.
      // No unread badge count either — nothing to accumulate.
      silent: false,
      tag: "nothing", // reuses the same notification slot; no stacking
      actions: data.actions || [],
    })
  );
});

// Closing or tapping the body of the notification does nothing — it just
// closes. Opening the site is opt-in only, through the "Observe" action
// button below. event.action is "" (not undefined) for a plain body tap
// or a dismiss, so it never matches "view" and nothing else happens.
//
// iOS ignores the actions array entirely (no button is ever shown there,
// and event.action is never populated), so this opt-in gate only applies
// on platforms that support notification actions (Android/desktop Chrome
// and similar). On iOS, tapping the notification still opens the app —
// that part is an OS-level default outside this file's control (see the
// iOS notification click investigation).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("notinglab1.com") && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("https://notinglab1.com");
        }
      })
    );
  }
});
