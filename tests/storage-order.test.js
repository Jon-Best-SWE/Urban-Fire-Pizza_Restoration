import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../src/data/catalog.js";
import { calculateLineTotal } from "../src/domain/pricing.js";
import { CART_STORAGE_KEY, createCartStore, deserializeCart, serializeCart } from "../src/services/cart-store.js";
import { ORDER_SESSION_KEY, createSessionOrderService } from "../src/services/order-service.js";

const selections = { size: "small-12", crust: "hand-tossed", sauce: "traditional", cheese: "mozzarella", meats: [], "additional-ingredients": [] };
const validLine = { productId: "build-your-own-pizza", selections, quantity: 2, unitPriceCents: 1, lineTotalCents: 2 };

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), values };
}

test("serialization stores configuration inputs but never caller prices", () => {
  const raw = serializeCart(catalog, [validLine]);
  assert.doesNotMatch(raw, /unitPrice|lineTotal/);
  const result = deserializeCart(catalog, raw);
  assert.equal(result.discarded, false); assert.equal(result.lines[0].quantity, 2);
  assert.equal(calculateLineTotal(catalog, result.lines[0]).lineTotalCents, 1198);
});

test("corrupt JSON and mismatched schemas are discarded", () => {
  assert.deepEqual(deserializeCart(catalog, "not-json"), { lines: [], discarded: true });
  const old = JSON.stringify({ storageVersion: 1, catalogVersion: "0.9.0", lines: [] });
  assert.deepEqual(deserializeCart(catalog, old), { lines: [], discarded: true });
});

test("unknown product and option IDs are discarded", () => {
  const unknownProduct = JSON.stringify({ storageVersion: 1, catalogVersion: catalog.schemaVersion, lines: [{ ...validLine, productId: "unknown" }] });
  const unknownOption = JSON.stringify({ storageVersion: 1, catalogVersion: catalog.schemaVersion, lines: [{ ...validLine, selections: { ...selections, crust: "mystery" } }] });
  assert.equal(deserializeCart(catalog, unknownProduct).discarded, true); assert.equal(deserializeCart(catalog, unknownOption).discarded, true);
});

test("store persists valid state and reloads it", () => {
  const storage = memoryStorage(); const first = createCartStore({ catalog, storage }); first.setLines([validLine]);
  const second = createCartStore({ catalog, storage }); assert.equal(second.getLines()[0].quantity, 2); assert.ok(storage.values.has(CART_STORAGE_KEY));
});

test("clearing the store removes all active cart lines", () => {
  const storage = memoryStorage(); const store = createCartStore({ catalog, storage });
  store.setLines([validLine]); store.clear();
  assert.deepEqual(store.getLines(), []);
  assert.equal(deserializeCart(catalog, storage.values.get(CART_STORAGE_KEY)).lines.length, 0);
});

test("blocked storage falls back to usable in-memory state", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
  const store = createCartStore({ catalog, storage: blocked }); store.setLines([validLine]);
  assert.equal(store.getLines().length, 1); assert.equal(store.getStatus().persistent, false);
});

test("persisted duplicate identities merge and invalid overflow is discarded", () => {
  const duplicate = JSON.parse(serializeCart(catalog, [{ ...validLine, quantity: 2 }, { ...validLine, quantity: 3 }]));
  const merged = deserializeCart(catalog, JSON.stringify(duplicate)); assert.equal(merged.lines.length, 1); assert.equal(merged.lines[0].quantity, 5);
  duplicate.lines[0].quantity = 20; duplicate.lines[1].quantity = 1; assert.equal(deserializeCart(catalog, JSON.stringify(duplicate)).discarded, true);
});

test("demo order is session-scoped with a 30-minute estimate", () => {
  const storage = memoryStorage(); const time = new Date("2026-10-02T18:00:00Z"); const service = createSessionOrderService(storage, () => time);
  const details = { name: "Demo Person", email: "demo@example.test", street: "1 Fiction Ave", city: "Demo", state: "CO", postalCode: "00000", notes: "" };
  service.saveDraft(details); assert.deepEqual(service.getDraft(), details);
  const confirmation = service.placeDemoOrder({ lines: [validLine], details });
  assert.match(confirmation.reference, /^DEMO-/); assert.equal(new Date(confirmation.estimatedArrival) - time, 30 * 60 * 1000); assert.ok(storage.values.has(ORDER_SESSION_KEY));
  assert.equal(createSessionOrderService(storage).getConfirmation().reference, confirmation.reference);
});

test("obsolete or corrupt session order state is ignored safely", () => {
  const corrupt = memoryStorage({ [ORDER_SESSION_KEY]: "not-json" });
  assert.equal(createSessionOrderService(corrupt).getConfirmation(), null);
  const obsolete = memoryStorage({ [ORDER_SESSION_KEY]: JSON.stringify({ sessionVersion: 0, confirmation: { reference: "OLD" } }) });
  assert.equal(createSessionOrderService(obsolete).getConfirmation(), null);
});

test("blocked session storage falls back to in-memory order state", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
  const service = createSessionOrderService(blocked, () => new Date("2026-10-02T18:00:00Z"));
  service.saveDraft({ name: "Fictional" });
  assert.equal(service.getDraft().name, "Fictional");
  assert.equal(service.isSessionBacked(), false);
});
