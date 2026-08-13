// subscribe-widget.js
//
// Wires up the "Notify me of nothing" toggle. This code never checks
// whether the visitor has paid. There is no code path in this file that
// could — it never reads wallet state, transaction history, or anything
// payment-related. Anyone who opens the site gets the same toggle.

// Paste the VAPID public key printed by `npx @pushforge/builder vapid`
// (the worker README explains how to generate it).
const VAPID_PUBLIC_KEY = "BAyoFu6cDDNsOhVdTjmQl45eIvXucTZTZEsmZOEIY9uIlQcfYJcL4wfzkzS7vAzq0dMLvCqNixallSZnaw2bcYc";

const WORKER_URL = "https://nothing-notifications.notinglab1.workers.dev";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function getRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/service-worker.js");
}

async function getExistingSubscription() {
  const registration = await getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

async function subscribe() {
  const registration = await getRegistration();
  if (!registration) throw new Error("Service worker not supported");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();
  await fetch(`${WORKER_URL}/api/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });

  return subscription;
}

async function unsubscribe() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await fetch(`${WORKER_URL}/api/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

function setToggleState(toggle, isOn) {
  toggle.setAttribute("aria-checked", String(isOn));
  toggle.classList.toggle("is-on", isOn);
}

function showStatusNote(message) {
  const note = document.getElementById("notify-status-note");
  if (!note) return;
  note.textContent = message;
  note.hidden = false;
}

export async function initNotifyToggle(toggleSelector = "#notify-toggle") {
  const toggle = document.querySelector(toggleSelector);
  if (!toggle) return;

  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  if (!supported) {
    toggle.setAttribute("disabled", "true");
    toggle.title = "Push notifications aren't supported in this browser.";
    const note = document.getElementById("notify-status-note");
    if (note) note.hidden = false;
    return;
  }

  const existing = await getExistingSubscription();
  setToggleState(toggle, Boolean(existing));

  toggle.addEventListener("click", async () => {
    const goingOn = !toggle.classList.contains("is-on");

    // Optimistic: flip the switch the instant it's tapped instead of
    // waiting on the permission prompt and the round-trip to the
    // worker — those can take a while (first-time permission dialog,
    // slow mobile network) and the wait was exactly what made the
    // toggle feel laggy on phones. Reconcile with reality below and
    // revert if either step fails.
    setToggleState(toggle, goingOn);
    toggle.setAttribute("disabled", "true");

    try {
      if (goingOn) {
        const sub = await subscribe();
        if (!sub) {
          setToggleState(toggle, false);
          showStatusNote(
            "Notification permission was denied, so the toggle was turned back off. Allow notifications in your browser settings and try again."
          );
        }
      } else {
        await unsubscribe();
      }
    } catch (err) {
      setToggleState(toggle, !goingOn);
      showStatusNote("Couldn't reach the notification server. Please try again.");
    } finally {
      toggle.removeAttribute("disabled");
    }
  });
}
