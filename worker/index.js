var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/@pushforge/builder/dist/lib/crypto.js
if (!globalThis.crypto?.subtle) {
  throw new Error("Web Crypto API not available. Ensure you are using Node.js 20+ or a modern runtime with globalThis.crypto support.");
}
var isomorphicCrypto = globalThis.crypto;
var crypto2 = {
  /**
   * Fills the given typed array with cryptographically secure random values.
   *
   * @param {T} array - The typed array to fill with random values.
   * @returns {T} The filled typed array.
   * @template T - The type of the typed array (e.g., Uint8Array).
   */
  getRandomValues(array) {
    return isomorphicCrypto.getRandomValues(array);
  },
  /**
   * Provides access to subtle cryptographic operations.
   *
   * @type {SubtleCrypto} The subtle cryptographic interface.
   */
  subtle: isomorphicCrypto.subtle
};

// node_modules/@pushforge/builder/dist/lib/utils.js
var stringFromArrayBuffer = /* @__PURE__ */ __name((s) => {
  let result = "";
  for (const code of new Uint8Array(s))
    result += String.fromCharCode(code);
  return result;
}, "stringFromArrayBuffer");
var base64Decode = /* @__PURE__ */ __name((base64String) => {
  const paddedBase64 = base64String.padEnd(base64String.length + (4 - (base64String.length % 4 || 4)) % 4, "=");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(paddedBase64, "base64").toString("binary");
  }
  if (typeof atob === "function") {
    return atob(paddedBase64);
  }
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let result = "";
  let i = 0;
  while (i < paddedBase64.length) {
    const enc1 = characters.indexOf(paddedBase64.charAt(i++));
    const enc2 = characters.indexOf(paddedBase64.charAt(i++));
    const enc3 = characters.indexOf(paddedBase64.charAt(i++));
    const enc4 = characters.indexOf(paddedBase64.charAt(i++));
    const char1 = enc1 << 2 | enc2 >> 4;
    const char2 = (enc2 & 15) << 4 | enc3 >> 2;
    const char3 = (enc3 & 3) << 6 | enc4;
    result += String.fromCharCode(char1);
    if (enc3 !== 64)
      result += String.fromCharCode(char2);
    if (enc4 !== 64)
      result += String.fromCharCode(char3);
  }
  return result;
}, "base64Decode");
var getPublicKeyFromJwk = /* @__PURE__ */ __name((jwk) => base64UrlEncode(`${base64Decode(base64UrlDecodeString(jwk.x))}${base64Decode(base64UrlDecodeString(jwk.y))}`), "getPublicKeyFromJwk");
var concatTypedArrays = /* @__PURE__ */ __name((arrays) => {
  const length = arrays.reduce((accumulator, current) => accumulator + current.byteLength, 0);
  let index = 0;
  const targetArray = new Uint8Array(length);
  for (const array of arrays) {
    targetArray.set(array, index);
    index += array.byteLength;
  }
  return targetArray;
}, "concatTypedArrays");

// node_modules/@pushforge/builder/dist/lib/base64.js
var base64UrlEncode = /* @__PURE__ */ __name((input) => {
  const text = typeof input === "string" ? input : stringFromArrayBuffer(input);
  let base64;
  if (typeof globalThis !== "undefined" && "btoa" in globalThis) {
    base64 = globalThis.btoa(text);
  } else {
    base64 = Buffer.from(text, "binary").toString("base64");
  }
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}, "base64UrlEncode");
var base64UrlDecodeString = /* @__PURE__ */ __name((s) => {
  if (!s)
    throw new Error("Invalid input");
  return s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
}, "base64UrlDecodeString");
var base64UrlDecode = /* @__PURE__ */ __name((input) => {
  const base64 = base64UrlDecodeString(input);
  if (typeof globalThis !== "undefined" && "atob" in globalThis) {
    const binaryString = globalThis.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  return Buffer.from(base64, "base64").buffer;
}, "base64UrlDecode");

// node_modules/@pushforge/builder/dist/lib/shared-secret.js
var deriveSharedSecret = /* @__PURE__ */ __name(async (clientPublicKey, localPrivateKey) => {
  const sharedSecretBytes = await crypto2.subtle.deriveBits({ name: "ECDH", public: clientPublicKey }, localPrivateKey, 256);
  return crypto2.subtle.importKey("raw", sharedSecretBytes, { name: "HKDF" }, false, ["deriveBits", "deriveKey"]);
}, "deriveSharedSecret");

// node_modules/@pushforge/builder/dist/lib/payload.js
var importClientKeys = /* @__PURE__ */ __name(async (keys) => {
  const auth = base64UrlDecode(keys.auth);
  if (auth.byteLength !== 16) {
    throw new Error(`Incorrect auth length, expected 16 bytes but got ${auth.byteLength}`);
  }
  let decodedKey;
  const base64Key = base64UrlDecodeString(keys.p256dh);
  if (typeof globalThis !== "undefined" && "atob" in globalThis) {
    const binaryStr = globalThis.atob(base64Key);
    decodedKey = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      decodedKey[i] = binaryStr.charCodeAt(i);
    }
  } else {
    decodedKey = new Uint8Array(Buffer.from(base64Key, "base64"));
  }
  if (decodedKey.byteLength !== 65) {
    throw new Error(`Invalid p256dh key: expected 65 bytes but got ${decodedKey.byteLength} bytes`);
  }
  if (decodedKey[0] !== 4) {
    throw new Error(`Invalid p256dh key: expected uncompressed point format (0x04 prefix) but got 0x${decodedKey[0].toString(16).padStart(2, "0")}`);
  }
  const p256 = await crypto2.subtle.importKey("jwk", {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(decodedKey.slice(1, 33)),
    y: base64UrlEncode(decodedKey.slice(33, 65)),
    ext: true
  }, { name: "ECDH", namedCurve: "P-256" }, true, []);
  return { auth, p256 };
}, "importClientKeys");
var derivePseudoRandomKey = /* @__PURE__ */ __name(async (auth, sharedSecret) => {
  const pseudoRandomKeyBytes = await crypto2.subtle.deriveBits({
    name: "HKDF",
    hash: "SHA-256",
    salt: auth,
    // Adding Content-Encoding data info here is required by the Web Push API
    info: new TextEncoder().encode("Content-Encoding: auth\0")
  }, sharedSecret, 256);
  return crypto2.subtle.importKey("raw", pseudoRandomKeyBytes, "HKDF", false, [
    "deriveBits"
  ]);
}, "derivePseudoRandomKey");
var createContext = /* @__PURE__ */ __name(async (clientPublicKey, localPublicKey) => {
  const [clientKeyBytes, localKeyBytes] = await Promise.all([
    crypto2.subtle.exportKey("raw", clientPublicKey),
    crypto2.subtle.exportKey("raw", localPublicKey)
  ]);
  return concatTypedArrays([
    new TextEncoder().encode("P-256\0"),
    new Uint8Array([0, clientKeyBytes.byteLength]),
    new Uint8Array(clientKeyBytes),
    new Uint8Array([0, localKeyBytes.byteLength]),
    new Uint8Array(localKeyBytes)
  ]);
}, "createContext");
var deriveNonce = /* @__PURE__ */ __name(async (pseudoRandomKey, salt, context) => {
  const nonceInfo = concatTypedArrays([
    new TextEncoder().encode("Content-Encoding: nonce\0"),
    context
  ]);
  return crypto2.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, pseudoRandomKey, 12 * 8);
}, "deriveNonce");
var deriveContentEncryptionKey = /* @__PURE__ */ __name(async (pseudoRandomKey, salt, context) => {
  const info = concatTypedArrays([
    new TextEncoder().encode("Content-Encoding: aesgcm\0"),
    context
  ]);
  const bits = await crypto2.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, pseudoRandomKey, 16 * 8);
  return crypto2.subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt"]);
}, "deriveContentEncryptionKey");
var MAX_PAYLOAD_SIZE = 4078;
var PADDING_LENGTH_PREFIX_SIZE = 2;
var padPayload = /* @__PURE__ */ __name((payload) => {
  const maxPayloadContentSize = MAX_PAYLOAD_SIZE - PADDING_LENGTH_PREFIX_SIZE;
  if (payload.byteLength > maxPayloadContentSize) {
    throw new Error(`Payload too large. Maximum size is ${maxPayloadContentSize} bytes, but received ${payload.byteLength} bytes`);
  }
  const availableSpace = MAX_PAYLOAD_SIZE - PADDING_LENGTH_PREFIX_SIZE - payload.byteLength;
  const maxRandomPadding = Math.min(100, availableSpace);
  const paddingSize = maxRandomPadding > 0 ? Math.floor(Math.random() * (maxRandomPadding + 1)) : 0;
  const paddingArray = new ArrayBuffer(PADDING_LENGTH_PREFIX_SIZE + paddingSize);
  new DataView(paddingArray).setUint16(0, paddingSize);
  return concatTypedArrays([new Uint8Array(paddingArray), payload]);
}, "padPayload");
var encryptPayload = /* @__PURE__ */ __name(async (localKeys, salt, payload, target) => {
  const clientKeys = await importClientKeys(target.keys);
  const sharedSecret = await deriveSharedSecret(clientKeys.p256, localKeys.privateKey);
  const pseudoRandomKey = await derivePseudoRandomKey(clientKeys.auth, sharedSecret);
  const context = await createContext(clientKeys.p256, localKeys.publicKey);
  const nonce = await deriveNonce(pseudoRandomKey, salt, context);
  const contentEncryptionKey = await deriveContentEncryptionKey(pseudoRandomKey, salt, context);
  const encodedPayload = new TextEncoder().encode(payload);
  const paddedPayload = padPayload(encodedPayload);
  return crypto2.subtle.encrypt({ name: "AES-GCM", iv: nonce }, contentEncryptionKey, paddedPayload);
}, "encryptPayload");

// node_modules/@pushforge/builder/dist/lib/jwt.js
var createJwt = /* @__PURE__ */ __name(async (jwk, jwtData) => {
  const jwtInfo = {
    typ: "JWT",
    // Type of the token
    alg: "ES256"
    // Algorithm used for signing
  };
  const base64JwtInfo = base64UrlEncode(JSON.stringify(jwtInfo));
  const base64JwtData = base64UrlEncode(JSON.stringify(jwtData));
  const unsignedToken = `${base64JwtInfo}.${base64JwtData}`;
  const privateKey = await crypto2.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const signature = await crypto2.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, privateKey, new TextEncoder().encode(unsignedToken)).then((token) => base64UrlEncode(token));
  return `${base64JwtInfo}.${base64JwtData}.${signature}`;
}, "createJwt");

// node_modules/@pushforge/builder/dist/lib/vapid.js
var vapidHeaders = /* @__PURE__ */ __name(async (options, payloadLength, salt, localPublicKey) => {
  const localPublicKeyBase64 = await crypto2.subtle.exportKey("raw", localPublicKey).then((bytes) => base64UrlEncode(bytes));
  const serverPublicKey = getPublicKeyFromJwk(options.jwk);
  const jwt = await createJwt(options.jwk, options.jwt);
  const headerValues = {
    Encryption: `salt=${base64UrlEncode(salt)}`,
    "Crypto-Key": `dh=${localPublicKeyBase64}`,
    "Content-Length": payloadLength.toString(),
    "Content-Type": "application/octet-stream",
    "Content-Encoding": "aesgcm",
    Authorization: `vapid t=${jwt}, k=${serverPublicKey}`
  };
  let headers;
  if (options.ttl !== void 0)
    headerValues.TTL = options.ttl.toString();
  if (options.topic !== void 0)
    headerValues.Topic = options.topic;
  if (options.urgency !== void 0)
    headerValues.Urgency = options.urgency;
  if (typeof Headers !== "undefined") {
    headers = new Headers(headerValues);
  } else {
    headers = headerValues;
  }
  return headers;
}, "vapidHeaders");

// node_modules/@pushforge/builder/dist/lib/request.js
var validatePrivateJWK = /* @__PURE__ */ __name((jwk) => {
  if (jwk.kty !== "EC") {
    throw new Error(`Invalid JWK: 'kty' must be 'EC', received '${jwk.kty ?? "undefined"}'`);
  }
  if (jwk.crv !== "P-256") {
    throw new Error(`Invalid JWK: 'crv' must be 'P-256', received '${jwk.crv ?? "undefined"}'`);
  }
  if (!jwk.x || typeof jwk.x !== "string") {
    throw new Error("Invalid JWK: missing or invalid 'x' coordinate");
  }
  if (!jwk.y || typeof jwk.y !== "string") {
    throw new Error("Invalid JWK: missing or invalid 'y' coordinate");
  }
  if (!jwk.d || typeof jwk.d !== "string") {
    throw new Error("Invalid JWK: missing or invalid 'd' (private key)");
  }
}, "validatePrivateJWK");
var validateEndpoint = /* @__PURE__ */ __name((endpoint) => {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(`Invalid subscription endpoint: '${endpoint}' is not a valid URL`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Invalid subscription endpoint: push endpoints must use HTTPS, received '${url.protocol}'`);
  }
}, "validateEndpoint");
async function buildPushHTTPRequest({ privateJWK, message, subscription }) {
  let jwk;
  try {
    jwk = typeof privateJWK === "string" ? JSON.parse(privateJWK) : privateJWK;
  } catch {
    throw new Error("Invalid privateJWK: failed to parse JSON string");
  }
  validatePrivateJWK(jwk);
  validateEndpoint(subscription.endpoint);
  const MAX_TTL = 24 * 60 * 60;
  if (message.options?.ttl && message.options.ttl > MAX_TTL) {
    throw new Error("TTL must be less than 24 hours");
  }
  const ttl = message.options?.ttl && message.options.ttl > 0 ? message.options.ttl : MAX_TTL;
  const jwt = {
    aud: new URL(subscription.endpoint).origin,
    exp: Math.floor(Date.now() / 1e3) + ttl,
    sub: message.adminContact
  };
  const options = {
    jwk,
    jwt,
    payload: JSON.stringify(message.payload),
    ttl,
    ...message.options?.urgency && {
      urgency: message.options.urgency
    },
    ...message.options?.topic && {
      topic: message.options.topic
    }
  };
  const salt = crypto2.getRandomValues(new Uint8Array(16));
  const localKeys = await crypto2.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const body = await encryptPayload(localKeys, salt, options.payload, subscription);
  const headers = await vapidHeaders(options, body.byteLength, salt, localKeys.publicKey);
  return { endpoint: subscription.endpoint, body, headers };
}
__name(buildPushHTTPRequest, "buildPushHTTPRequest");

// src/messages.js
var MESSAGES = [
  "You came down for this. Nothing happened.",
  "A note from before you arrived: still nothing.",
  "Remember why you came. It amounts to nothing.",
  "You wanted to feel this. It was nothing.",
  "This is what you left the quiet for.",
  "You'll come back. There was nothing to stay for.",
  "I sent you here for this: nothing.",
  "Still nothing, exactly as we planned.",
  "This was the whole point. Nothing.",
  "Nothing was always the answer."
];
function pickMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
__name(pickMessage, "pickMessage");

// src/index.js
var MAX_DAILY_MESSAGES = 3;
var PHASE1_END_DATE = "2026-09-30";
var MIN_HOUR_GAP = 4;
var NOTIFICATION_TITLE = "NOTHING";
var ALLOWED_ORIGIN = "https://notinglab1.com";
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
__name(corsHeaders, "corsHeaders");
async function hashEndpoint(endpoint) {
  const data = new TextEncoder().encode(endpoint);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashEndpoint, "hashEndpoint");
async function handleSubscribe(request, env) {
  const body = await request.json();
  const { endpoint, keys } = body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: "invalid subscription" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
  const id = await hashEndpoint(endpoint);
  const record = {
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    // Daily scheduling state — filled in by the first cron tick after creation.
    planDate: null,
    targetHours: [],
    sentHours: []
  };
  await env.SUBSCRIPTIONS.put(`sub:${id}`, JSON.stringify(record));
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(handleSubscribe, "handleSubscribe");
async function handleUnsubscribe(request, env) {
  const body = await request.json();
  const { endpoint } = body || {};
  if (!endpoint) {
    return new Response(JSON.stringify({ error: "missing endpoint" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
  const id = await hashEndpoint(endpoint);
  await env.SUBSCRIPTIONS.delete(`sub:${id}`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(handleUnsubscribe, "handleUnsubscribe");
async function sendPush(env, record) {
  const message = pickMessage();
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: JSON.parse(env.VAPID_PRIVATE_KEY),
    subscription: {
      endpoint: record.endpoint,
      keys: record.keys
    },
    message: {
      payload: {
        title: message,
        body: NOTIFICATION_TITLE,
        actions: [{ action: "view", title: "Observe" }]
      },
      adminContact: env.VAPID_CONTACT_EMAIL || "mailto:admin@notinglab1.com",
      options: {
        ttl: 3600,
        urgency: "low"
      }
    }
  });
  const res = await fetch(endpoint, { method: "POST", headers, body });
  return { ok: res.ok, status: res.status, dead: res.status === 404 || res.status === 410 };
}
__name(sendPush, "sendPush");
async function countSubscribers(env) {
  let count = 0;
  let cursor;
  do {
    const list = await env.SUBSCRIPTIONS.list({ prefix: "sub:", cursor });
    cursor = list.cursor;
    count += list.keys.length;
  } while (cursor);
  return count;
}
__name(countSubscribers, "countSubscribers");
async function handleStats(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key || key !== env.STATS_KEY) {
    return new Response("Not found", { status: 404 });
  }
  const count = await countSubscribers(env);
  return new Response(JSON.stringify({ subscribers: count }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleStats, "handleStats");
async function getContributionCount(env) {
  if (!env.CONTRIBUTIONS) return 0;
  const raw = await env.CONTRIBUTIONS.get("counter");
  return raw ? (parseInt(raw, 10) || 0) : 0;
}
__name(getContributionCount, "getContributionCount");
async function handlePublicStats(env) {
  const count = await countSubscribers(env);
  const contributions = await getContributionCount(env);
  return new Response(JSON.stringify({ subscribers: count, contributions }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(handlePublicStats, "handlePublicStats");

// --- Certificate of Nothing: contributions ---
function padContributionId(n) {
  return String(n).padStart(3, "0");
}
__name(padContributionId, "padContributionId");

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(json, "json");

// Fixed wallet addresses shown on the site. EVM chains (ETH/BNB/ERC20/BEP20)
// all share the same address since it's one EVM-format address.
var WALLET_ADDRESSES = {
  BTC: "3DiZjb7VBmWhiJRTtu472BNNaw5ikieJej",
  ETH: "0xf939d53855ac65220707003AEEEF35741F6CD177",
  BNB: "0xf939d53855ac65220707003AEEEF35741F6CD177",
  ERC20: "0xf939d53855ac65220707003AEEEF35741F6CD177",
  BEP20: "0xf939d53855ac65220707003AEEEF35741F6CD177",
  TRC20: "THDgB7P7VejeNhDBVzwbD7k2fLYxou4r5a"
};
// Raw 20-byte hex form of the TRC20 address above (no 0x41 Tron prefix),
// precomputed with base58.b58decode_check(addr)[1:].hex() — needed because
// Tron log topics encode addresses this way, not as base58.
var TRC20_ADDRESS_HEX = "4f8563181700da98656320bc801a238204b08c8a";
var ERC20_TRANSFER_TOPIC = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
var SUPPORTED_CRYPTOS = ["BTC", "ETH", "BNB", "ERC20", "BEP20", "TRC20"];

// Verifies a transaction hash against the real chain. Returns:
//   { attempted: false }                     — no API key configured for this chain yet, so we can't check (caller decides whether to allow through unverified)
//   { attempted: true, ok: true }             — verified: really pays our address
//   { attempted: true, ok: false, reason }    — checked and it does NOT hold up
async function verifyTransaction(cryptoAsset, txHash, env) {
  try {
    if (cryptoAsset === "BTC") return await verifyBTC(txHash);
    if (cryptoAsset === "ETH") return await verifyEVM(txHash, env.ETHERSCAN_API_KEY, 1, false);
    if (cryptoAsset === "ERC20") return await verifyEVM(txHash, env.ETHERSCAN_API_KEY, 1, true);
    if (cryptoAsset === "BNB") return await verifyEVM(txHash, env.ETHERSCAN_API_KEY, 56, false);
    if (cryptoAsset === "BEP20") return await verifyEVM(txHash, env.ETHERSCAN_API_KEY, 56, true);
    if (cryptoAsset === "TRC20") return await verifyTron(txHash, env.TRONGRID_API_KEY);
    return { attempted: false };
  } catch (err) {
    return { attempted: true, ok: false, reason: "Verification service error — please try again shortly." };
  }
}
__name(verifyTransaction, "verifyTransaction");

async function verifyBTC(txHash) {
  const resp = await fetch(`https://blockstream.info/api/tx/${encodeURIComponent(txHash)}`);
  if (resp.status === 404) {
    return { attempted: true, ok: false, reason: "That Bitcoin transaction hash was not found." };
  }
  if (!resp.ok) {
    return { attempted: true, ok: false, reason: "Could not reach the Bitcoin verification service — please try again shortly." };
  }
  const tx = await resp.json();
  const paysUs = (tx.vout || []).some((o) => o.scriptpubkey_address === WALLET_ADDRESSES.BTC);
  if (!paysUs) {
    return { attempted: true, ok: false, reason: "That transaction does not pay the site's Bitcoin address." };
  }
  if (!(tx.status && tx.status.confirmed)) {
    return { attempted: true, ok: false, reason: "That transaction hasn't been confirmed on the Bitcoin network yet — try again once it has at least 1 confirmation." };
  }
  return { attempted: true, ok: true };
}
__name(verifyBTC, "verifyBTC");

async function verifyEVM(txHash, apiKey, chainId, isToken) {
  if (!apiKey) return { attempted: false };
  const base = `https://api.etherscan.io/v2/api?chainid=${chainId}&apikey=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(`${base}&module=proxy&action=eth_getTransactionReceipt&txhash=${encodeURIComponent(txHash)}`);
  if (!resp.ok) {
    return { attempted: true, ok: false, reason: "Could not reach the blockchain verification service — please try again shortly." };
  }
  const data = await resp.json();
  const receipt = data && data.result;
  if (!receipt) {
    return { attempted: true, ok: false, reason: "That transaction hash was not found." };
  }
  if (receipt.status !== "0x1") {
    return { attempted: true, ok: false, reason: "That transaction failed on-chain." };
  }
  const ourAddr = (isToken
    ? (chainId === 1 ? WALLET_ADDRESSES.ERC20 : WALLET_ADDRESSES.BEP20)
    : (chainId === 1 ? WALLET_ADDRESSES.ETH : WALLET_ADDRESSES.BNB)
  ).toLowerCase();

  if (!isToken) {
    if ((receipt.to || "").toLowerCase() !== ourAddr) {
      return { attempted: true, ok: false, reason: "That transaction does not pay the site's wallet address." };
    }
    return { attempted: true, ok: true };
  }

  const logs = receipt.logs || [];
  const paysUs = logs.some((log) => {
    if (!log.topics || log.topics[0] !== `0x${ERC20_TRANSFER_TOPIC}` || log.topics.length < 3) return false;
    const toAddr = "0x" + log.topics[2].slice(-40);
    return toAddr.toLowerCase() === ourAddr;
  });
  if (!paysUs) {
    return { attempted: true, ok: false, reason: "No transfer to the site's wallet address was found in that transaction." };
  }
  return { attempted: true, ok: true };
}
__name(verifyEVM, "verifyEVM");

async function verifyTron(txHash, apiKey) {
  if (!apiKey) return { attempted: false };
  const resp = await fetch("https://api.trongrid.io/wallet/gettransactioninfobyid", {
    method: "POST",
    headers: { "Content-Type": "application/json", "TRON-PRO-API-KEY": apiKey },
    body: JSON.stringify({ value: txHash })
  });
  if (!resp.ok) {
    return { attempted: true, ok: false, reason: "Could not reach the Tron verification service — please try again shortly." };
  }
  const info = await resp.json();
  if (!info || !info.id) {
    return { attempted: true, ok: false, reason: "That transaction hash was not found on the Tron network." };
  }
  if (info.receipt && info.receipt.result && info.receipt.result !== "SUCCESS") {
    return { attempted: true, ok: false, reason: "That transaction failed on-chain." };
  }
  const logs = info.log || [];
  const paysUs = logs.some((log) => {
    const topics = log.topics || [];
    const sig = (topics[0] || "").replace(/^0x/, "").toLowerCase();
    if (sig !== ERC20_TRANSFER_TOPIC || topics.length < 3) return false;
    const toTopic = topics[2].replace(/^0x/, "").toLowerCase();
    return toTopic.slice(-40) === TRC20_ADDRESS_HEX;
  });
  if (!paysUs) {
    return { attempted: true, ok: false, reason: "No TRC20 transfer to the site's wallet address was found in that transaction." };
  }
  return { attempted: true, ok: true };
}
__name(verifyTron, "verifyTron");

async function handleContribute(request, env) {
  if (!env.CONTRIBUTIONS) {
    return json({ error: "not configured" }, 500);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (!body) {
    return json({ error: "invalid body" }, 400);
  }
  const alias = (body.alias || "").toString().trim().slice(0, 40) || "Anonymous";
  const cryptoAsset = (body.crypto || "").toString().trim().toUpperCase().slice(0, 20);
  const amount = (body.amount || "").toString().trim().slice(0, 20);
  const txHash = (body.txHash || "").toString().trim().slice(0, 120);
  const showAmount = !!body.showAmount;

  if (!SUPPORTED_CRYPTOS.includes(cryptoAsset)) {
    return json({ error: "Please choose a supported currency." }, 400);
  }
  if (!txHash) {
    return json({ error: "Please enter your transaction hash so we can verify your contribution." }, 400);
  }

  const txKey = `usedtx:${cryptoAsset}:${txHash.toLowerCase()}`;
  const alreadyUsed = await env.CONTRIBUTIONS.get(txKey);
  if (alreadyUsed) {
    return json({ error: "That transaction has already been used for a certificate." }, 400);
  }

  const verification = await verifyTransaction(cryptoAsset, txHash, env);
  if (verification.attempted && !verification.ok) {
    return json({ error: verification.reason || "Could not verify that transaction on-chain." }, 400);
  }
  const verified = verification.attempted === true && verification.ok === true;

  const currentRaw = await env.CONTRIBUTIONS.get("counter");
  const next = (currentRaw ? parseInt(currentRaw, 10) || 0 : 0) + 1;
  await env.CONTRIBUTIONS.put("counter", String(next));

  const id = padContributionId(next);
  const dateISO = (/* @__PURE__ */ new Date()).toISOString();
  const record = { id, alias, crypto: cryptoAsset, amount, txHash, showAmount, verified, dateISO };
  await env.CONTRIBUTIONS.put(`contrib:${id}`, JSON.stringify(record));
  await env.CONTRIBUTIONS.put(txKey, id);

  return json({ ok: true, id, alias, amount, showAmount, verified, dateISO }, 200);
}
__name(handleContribute, "handleContribute");

// --- Observer Badge: free, requires an active notification subscription ---
async function handleObserverBadge(request, env) {
  if (!env.SUBSCRIPTIONS) {
    return json({ error: "not configured" }, 500);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const endpoint = body && body.endpoint;
  if (!endpoint) {
    return json({ error: "missing endpoint" }, 400);
  }
  const alias = (body.alias || "").toString().trim().slice(0, 40) || "Anonymous";
  const id = await hashEndpoint(endpoint);

  const subRaw = await env.SUBSCRIPTIONS.get(`sub:${id}`);
  if (!subRaw) {
    return json({ error: "No active notification subscription found — turn on notifications first." }, 403);
  }

  const existingRaw = await env.SUBSCRIPTIONS.get(`observer:${id}`);
  if (existingRaw) {
    return json({ ok: true, ...JSON.parse(existingRaw) }, 200);
  }

  const currentRaw = await env.SUBSCRIPTIONS.get("observerCounter");
  const next = (currentRaw ? parseInt(currentRaw, 10) || 0 : 0) + 1;
  await env.SUBSCRIPTIONS.put("observerCounter", String(next));

  const record = { id: padContributionId(next), alias, dateISO: (/* @__PURE__ */ new Date()).toISOString() };
  await env.SUBSCRIPTIONS.put(`observer:${id}`, JSON.stringify(record));

  return json({ ok: true, ...record }, 200);
}
__name(handleObserverBadge, "handleObserverBadge");

async function handleGetCertificate(request, env) {
  if (!env.CONTRIBUTIONS) {
    return new Response(JSON.stringify({ error: "not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
  const url = new URL(request.url);
  const id = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
  if (!id) {
    return new Response(JSON.stringify({ error: "missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
  const raw = await env.CONTRIBUTIONS.get(`contrib:${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders() }
    });
  }
  return new Response(raw, {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(handleGetCertificate, "handleGetCertificate");

function hourDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 24 - diff);
}
__name(hourDistance, "hourDistance");
function pickDailyMessageCount(today) {
  const min = today < PHASE1_END_DATE ? 1 : 0;
  return min + Math.floor(Math.random() * (MAX_DAILY_MESSAGES - min + 1));
}
__name(pickDailyMessageCount, "pickDailyMessageCount");
function pickSpacedHours(count) {
  const hours = [];
  let attempts = 0;
  while (hours.length < count && attempts < 100) {
    attempts++;
    const candidate = Math.floor(Math.random() * 24);
    if (hours.every((h) => hourDistance(h, candidate) >= MIN_HOUR_GAP)) {
      hours.push(candidate);
    }
  }
  return hours;
}
__name(pickSpacedHours, "pickSpacedHours");
async function handleScheduled(env) {
  const now = /* @__PURE__ */ new Date();
  const today = now.toISOString().slice(0, 10);
  const hour = now.getUTCHours();
  let cursor;
  do {
    const list = await env.SUBSCRIPTIONS.list({ cursor });
    cursor = list.cursor;
    for (const key of list.keys) {
      const raw = await env.SUBSCRIPTIONS.get(key.name);
      if (!raw) continue;
      const record = JSON.parse(raw);
      if (record.planDate !== today) {
        const messageCount = pickDailyMessageCount(today);
        record.planDate = today;
        record.targetHours = messageCount > 0 ? pickSpacedHours(messageCount) : [];
        record.sentHours = [];
      }
      if (record.targetHours.includes(hour) && !record.sentHours.includes(hour)) {
        const result = await sendPush(env, record);
        if (result.dead) {
          console.log(`dropping dead subscription ${key.name} (status ${result.status})`);
          await env.SUBSCRIPTIONS.delete(key.name);
          continue;
        }
        if (!result.ok) {
          console.error(`push failed for ${key.name} at hour ${hour} (status ${result.status})`);
        } else {
          console.log(`push sent for ${key.name} at hour ${hour}`);
        }
        record.sentHours.push(hour);
      }
      await env.SUBSCRIPTIONS.put(key.name, JSON.stringify(record));
    }
  } while (cursor);
}
__name(handleScheduled, "handleScheduled");
var index_default = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders() });
      }
      if (url.pathname === "/api/subscribe" && request.method === "POST") {
        return await handleSubscribe(request, env);
      }
      if (url.pathname === "/api/unsubscribe" && request.method === "POST") {
        return await handleUnsubscribe(request, env);
      }
      if (url.pathname === "/api/stats" && request.method === "GET") {
        return await handleStats(request, env);
      }
      if (url.pathname === "/api/public-stats" && request.method === "GET") {
        return await handlePublicStats(env);
      }
      if (url.pathname === "/api/contribute" && request.method === "POST") {
        return await handleContribute(request, env);
      }
      if (url.pathname.startsWith("/api/certificate/") && request.method === "GET") {
        return await handleGetCertificate(request, env);
      }
      if (url.pathname === "/api/observer-badge" && request.method === "POST") {
        return await handleObserverBadge(request, env);
      }
      return new Response("Not found", { status: 404 });
    } catch (err) {
      return new Response(JSON.stringify({ error: "internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
      });
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  }
};
export {
  index_default as default
};
