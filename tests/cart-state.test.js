import assert from "node:assert/strict";
import test from "node:test";
import { catalog } from "../src/data/catalog.js";
import { addCartLine, removeCartLine, replaceCartLine, setCartLineQuantity } from "../src/state/cart-state.js";

const selections = { size: "small-12", crust: "hand-tossed", sauce: "traditional", cheese: "mozzarella", meats: [], "additional-ingredients": [] };
const line = (overrides = {}) => ({ productId: "pepperoni-pizza", selections, quantity: 1, ...overrides });

test("adding identical configurations merges quantities", () => {
  const once = addCartLine(catalog, [], line({ quantity: 2 }));
  const twice = addCartLine(catalog, once, line({ quantity: 3 }));
  assert.equal(twice.length, 1); assert.equal(twice[0].quantity, 5);
});

test("different configurations remain separate", () => {
  const first = addCartLine(catalog, [], line());
  const second = addCartLine(catalog, first, line({ selections: { ...selections, crust: "thin" } }));
  assert.equal(second.length, 2);
});

test("merge refuses to exceed the maximum quantity", () => {
  const lines = addCartLine(catalog, [], line({ quantity: 20 }));
  assert.throws(() => addCartLine(catalog, lines, line()), (error) => error.code === "CART_QUANTITY_LIMIT");
});

test("editing can merge safely with another identical line", () => {
  const original = addCartLine(catalog, [], line({ quantity: 2 }));
  const different = addCartLine(catalog, original, line({ selections: { ...selections, crust: "thin" }, quantity: 3 }));
  const result = replaceCartLine(catalog, different, different[1].id, line({ quantity: 3 }));
  assert.equal(result.length, 1); assert.equal(result[0].quantity, 5);
});

test("editing to an over-limit merge leaves the source array unchanged", () => {
  const original = addCartLine(catalog, [], line({ quantity: 19 }));
  const different = addCartLine(catalog, original, line({ selections: { ...selections, crust: "thin" }, quantity: 2 }));
  assert.throws(() => replaceCartLine(catalog, different, different[1].id, line({ quantity: 2 })), (error) => error.code === "CART_QUANTITY_LIMIT");
  assert.equal(different.length, 2); assert.equal(different[0].quantity, 19);
});

test("quantity update and removal target a deterministic line identity", () => {
  const lines = addCartLine(catalog, [], line());
  const updated = setCartLineQuantity(catalog, lines, lines[0].id, 7);
  assert.equal(updated[0].quantity, 7); assert.deepEqual(removeCartLine(catalog, updated, updated[0].id), []);
});

