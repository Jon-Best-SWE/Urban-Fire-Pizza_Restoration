export const ORDER_SESSION_KEY = "urban-fire-pizza.order.v1";
export const ORDER_SESSION_VERSION = 1;

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function createSessionOrderService(storage, now = () => new Date()) {
  let memory = {};
  let available = false;
  try {
    if (arguments.length === 0) storage = globalThis.sessionStorage;
    available = Boolean(storage);
    const restored = safeParse(storage?.getItem(ORDER_SESSION_KEY));
    memory = restored?.sessionVersion === ORDER_SESSION_VERSION ? restored : { sessionVersion: ORDER_SESSION_VERSION };
  } catch { available = false; }
  if (!memory.sessionVersion) memory.sessionVersion = ORDER_SESSION_VERSION;
  const persist = () => { if (available) { try { storage.setItem(ORDER_SESSION_KEY, JSON.stringify(memory)); } catch { available = false; } } };
  return Object.freeze({
    saveDraft(details) { memory = { ...memory, draft: structuredClone(details) }; persist(); },
    getDraft() { return memory.draft ? structuredClone(memory.draft) : null; },
    placeDemoOrder({ lines, details }) {
      const placedAt = now();
      const token = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase() ?? Math.random().toString(36).slice(2, 10).toUpperCase();
      const confirmation = { reference: `DEMO-${token}`, placedAt: placedAt.toISOString(), estimatedArrival: new Date(placedAt.getTime() + 30 * 60 * 1000).toISOString(), lines: structuredClone(lines), details: structuredClone(details) };
      memory = { sessionVersion: ORDER_SESSION_VERSION, confirmation };
      persist();
      return confirmation;
    },
    getConfirmation() { return memory.confirmation ? structuredClone(memory.confirmation) : null; },
    clear() { memory = { sessionVersion: ORDER_SESSION_VERSION }; if (available) { try { storage.removeItem(ORDER_SESSION_KEY); } catch { available = false; } } },
    isSessionBacked() { return available; },
  });
}

export const orderService = createSessionOrderService();
