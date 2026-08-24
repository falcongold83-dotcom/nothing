// subscribe-widget.js
//
// Wires up the "Notify me of nothing" toggle. This code never checks
// whether the visitor has paid. There is no code path in this file that
// could — it never reads wallet state, transaction history, or anything
// payment-related. Anyone who opens the site gets the same toggle.

// Paste the VAPID public key printed by `npx @pushforge/builder vapid`
// (the worker README explains how to generate it).
const VAPID_PUBLIC_KEY = "BAyoFu6cDDNsOhVdTjmQl45eIvXucTZTZEsmZOEIY9uIlQcfYJcL4wfzkzS7vAzq0dMLvCqNixallSZnaw2bcYc";

// Same-site custom domain instead of the *.workers.dev origin — iOS Safari
// in standalone (Home Screen) mode was hanging/timing out on fetches to a
// third-party workers.dev domain.
const WORKER_URL = "https://api.notinglab1.com";

const FETCH_TIMEOUT_MS = 5000;

// Stable per-browser id, generated once and kept in localStorage. The
// worker used to key subscriptions by hash(endpoint), but push endpoints
// can rotate (FCM token refresh, browser-driven pushsubscriptionchange)
// between subscribing and unsubscribing — when that happened, unsubscribe
// hashed a different endpoint than the one the record was stored under, so
// the delete silently matched nothing and the "off" toggle kept getting
// pushes. Sending this id lets the server find the same record regardless
// of what the endpoint currently is.
const CLIENT_ID_STORAGE_KEY = "nothing-client-id";

function generateClientId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!id) {
    id = generateClientId();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
  }
  return id;
}

// AbortController-backed fetch so a request that never settles (seen after
// this fix shipped — iOS leaving a connection half-open instead of failing
// it outright) can't hang the toggle forever.
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// iOS standalone PWAs sometimes drop the network stack while backgrounded;
// the first fetch after resuming can fail (or hang) even though the network
// is fine a moment later. One retry after a short delay covers that case
// without adding real latency to the common, first-try-succeeds path.
async function fetchWithRetry(url, options) {
  console.log("FETCH START:", url);
  try {
    const res = await fetchWithTimeout(url, options);
    console.log("FETCH SUCCESS:", url);
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("FETCH TIMEOUT:", url);
    } else {
      console.error(
        "FETCH FAILED (retry 1):",
        url,
        err.name,
        err.message,
        "| navigator.onLine:",
        navigator.onLine
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("FETCH START (retry):", url);
    try {
      const res = await fetchWithTimeout(url, options);
      console.log("FETCH SUCCESS (retry):", url);
      return res;
    } catch (err2) {
      if (err2.name === "AbortError") {
        console.error("FETCH TIMEOUT (retry):", url);
      } else {
        console.error(
          "FETCH FAILED (retry 2):",
          url,
          err2.name,
          err2.message,
          "| navigator.onLine:",
          navigator.onLine
        );
      }
      throw err2;
    }
  }
}

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
  await fetchWithRetry(`${WORKER_URL}/api/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      clientId: getClientId(),
    }),
  });

  return subscription;
}

async function unsubscribe() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  // Read fresh off the live subscription (not a cached value) right before
  // use, since this is the last point at which it's guaranteed current.
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await fetchWithRetry(`${WORKER_URL}/api/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, clientId: getClientId() }),
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

const NOTIFY_GUIDE_STEPS = [
  "Turning this on? Your browser will ask for permission — allow it.",
  "Also check your phone's settings: notifications must be enabled for this browser, or nothing will reach you.",
];

// Shown every time the toggle goes from off to on — not just the first
// time — since the phone-settings reminder stays relevant on every visit.
function showNotifyGuide() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "notify-guide-overlay";

    const modal = document.createElement("div");
    modal.className = "notify-guide-modal";
    overlay.appendChild(modal);

    let step = 0;

    function close() {
      overlay.remove();
      resolve();
    }

    function render() {
      modal.innerHTML = "";

      const dots = document.createElement("div");
      dots.className = "notify-guide-dots";
      NOTIFY_GUIDE_STEPS.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "notify-guide-dot" + (i === step ? " is-on" : "");
        dots.appendChild(dot);
      });
      modal.appendChild(dots);

      const text = document.createElement("p");
      text.className = "notify-guide-text";
      text.textContent = NOTIFY_GUIDE_STEPS[step];
      modal.appendChild(text);

      const row = document.createElement("div");
      row.className = "notify-guide-row";

      const skipBtn = document.createElement("button");
      skipBtn.type = "button";
      skipBtn.className = "notify-guide-skip";
      skipBtn.textContent = "Skip";
      skipBtn.addEventListener("click", close);

      const isLast = step === NOTIFY_GUIDE_STEPS.length - 1;
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "notify-guide-next";
      nextBtn.textContent = isLast ? "Allow" : "Next";
      nextBtn.addEventListener("click", () => {
        if (isLast) {
          close();
        } else {
          step += 1;
          render();
        }
      });

      row.appendChild(skipBtn);
      row.appendChild(nextBtn);
      modal.appendChild(row);
    }

    render();
    document.body.appendChild(overlay);
  });
}

export async function initNotifyToggle(toggleSelector = "#notify-toggle") {
  const toggle = document.querySelector(toggleSelector);
  console.log("TOGGLE ELEMENT FOUND: " + (toggle ? "yes" : "NO - NULL"));
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
    console.log("TOGGLE CLICKED");
    const goingOn = !toggle.classList.contains("is-on");
    toggle.setAttribute("disabled", "true");

    // Not optimistic: the toggle only flips once the server has actually
    // confirmed the subscribe/unsubscribe. An earlier version flipped it
    // immediately and reconciled afterward, but that meant a failed or
    // hung request could leave the UI showing "on" when the server never
    // received anything — the loading spinner is the feedback instead.
    toggle.classList.add("is-loading");

    try {
      if (goingOn) {
        await showNotifyGuide();

        const sub = await subscribe();
        if (!sub) {
          showStatusNote(
            "Notification permission was denied. Allow notifications in your browser settings and try again."
          );
        } else {
          setToggleState(toggle, true);
        }
      } else {
        await unsubscribe();
        setToggleState(toggle, false);
      }
    } catch (err) {
      console.error(
        "TOGGLE ERROR:",
        err.name,
        err.message,
        "| navigator.onLine:",
        navigator.onLine,
        "| stack:",
        err.stack
      );
      showStatusNote("Couldn't reach the notification server. Please try again.");
    } finally {
      toggle.removeAttribute("disabled");
      toggle.classList.remove("is-loading");
    }
  });
  console.log("LISTENER ATTACHED");
}
