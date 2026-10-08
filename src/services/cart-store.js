import { catalog as defaultCatalog } from "../data/catalog.js";
import { normalizeCartLine } from "../state/cart-state.js";
import { addCartLine } from "../state/cart-state.js";

export const CART_STORAGE_KEY = "urban-fire-pizza.cart.v1";
export const CART_STORAGE_VERSION = 1;

function readPayload(catalog, raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (parsed?.storageVersion !== CART_STORAGE_VERSION || parsed?.catalogVersion !== catalog.schemaVersion || !Array.isArray(parsed.lines)) {
    throw new Error("Stored cart schema is not compatible with the current catalog.");
  }
  return parsed.lines.reduce((lines, line) => addCartLine(catalog, lines, normalizeCartLine(catalog, line)), []);
}

export function serializeCart(catalog, lines) {
  return JSON.stringify({
    storageVersion: CART_STORAGE_VERSION,
    catalogVersion: catalog.schemaVersion,
    lines: lines.map((line) => {
      const normalized = normalizeCartLine(catalog, line);
      return { productId: normalized.productId, selections: normalized.selections, quantity: normalized.quantity };
    }),
  });
}

export function deserializeCart(catalog, raw) {
  try { return { lines: readPayload(catalog, raw), discarded: false }; }
  catch { return { lines: [], discarded: true }; }
}

export function createCartStore(options = {}) {
  const catalog = options.catalog ?? defaultCatalog;
  let storage = options.storage;
  let memory = [];
  let persistent = false;
  let discarded = false;
  try {
    if (!("storage" in options)) storage = globalThis.localStorage;
    persistent = Boolean(storage);
    const result = deserializeCart(catalog, storage?.getItem(CART_STORAGE_KEY));
    memory = result.lines;
    discarded = result.discarded;
    if (discarded) storage?.removeItem(CART_STORAGE_KEY);
  } catch { persistent = false; }

  function persist() {
    if (!persistent) return;
    try { storage.setItem(CART_STORAGE_KEY, serializeCart(catalog, memory)); }
    catch { persistent = false; }
  }

  return Object.freeze({
    getLines: () => memory.map((line) => ({ ...line, selections: structuredClone(line.selections) })),
    setLines: (lines) => { memory = lines.map((line) => normalizeCartLine(catalog, line)); persist(); return memory; },
    clear: () => { memory = []; persist(); },
    getStatus: () => ({ persistent, discarded }),
  });
}

export const cartStore = createCartStore();
