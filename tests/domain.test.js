import assert from "node:assert/strict";
import test from "node:test";

import { catalog } from "../src/data/catalog.js";
import { calculateCartSubtotal } from "../src/domain/cart.js";
import {
  createConfigurationIdentity,
  validateConfiguration,
} from "../src/domain/configuration.js";
import { DomainValidationError } from "../src/domain/errors.js";
import {
  calculateLineTotal,
  calculateUnitPrice,
  getOptionSurchargeCents,
} from "../src/domain/pricing.js";
import { validateQuantity } from "../src/domain/quantity.js";
import { createLocalCatalogService } from "../src/services/catalog-service.js";

const basicSelections = Object.freeze({
  size: "small-12",
  crust: "hand-tossed",
  sauce: "traditional",
  cheese: "mozzarella",
  meats: [],
  "additional-ingredients": [],
});

function expectCode(expectedCode, operation) {
  assert.throws(operation, (error) => {
    assert.ok(error instanceof DomainValidationError);
    assert.equal(error.code, expectedCode);
    return true;
  });
}

test("catalog has a version, six stable product IDs, and integer-cent prices", () => {
  assert.equal(catalog.schemaVersion, "1.0.0");
  assert.equal(catalog.maximumLineQuantity, 20);
  assert.deepEqual(
    catalog.products.map(({ id, basePriceCents }) => [id, basePriceCents]),
    [
      ["pepperoni-pizza", 699],
      ["margherita-pizza", 999],
      ["artichoke-pizza", 699],
      ["meat-lovers-pizza", 799],
      ["vegetarian-pizza", 699],
      ["build-your-own-pizza", 499],
    ],
  );
  assert.ok(
    catalog.products.every(({ basePriceCents }) =>
      Number.isSafeInteger(basePriceCents),
    ),
  );
});

test("every base price is used with the same zero/required minimum surcharge choices", () => {
  const expected = new Map([
    ["pepperoni-pizza", 799],
    ["margherita-pizza", 1099],
    ["artichoke-pizza", 799],
    ["meat-lovers-pizza", 899],
    ["vegetarian-pizza", 799],
    ["build-your-own-pizza", 599],
  ]);

  for (const product of catalog.products) {
    assert.equal(
      calculateUnitPrice(catalog, product.id, basicSelections),
      expected.get(product.id),
    );
  }
});

test("all size, crust, sauce, and cheese surcharge categories calculate correctly", () => {
  const groups = [
    ["size", { "small-12": 100, "medium-14": 200, "large-16": 300 }],
    ["crust", { "hand-tossed": 0, thin: 100, "deep-dish": 200 }],
    ["sauce", { traditional: 0, alfredo: 100, barbecue: 100 }],
    ["cheese", { mozzarella: 0, cheddar: 100, parmesan: 100 }],
  ];

  for (const [groupId, options] of groups) {
    for (const [optionId, expectedSurcharge] of Object.entries(options)) {
      const selections = { ...basicSelections, [groupId]: optionId };
      const price = calculateUnitPrice(catalog, "build-your-own-pizza", selections);
      const baselineWithoutGroup = 499 + (groupId === "size" ? 0 : 100);
      assert.equal(price, baselineWithoutGroup + expectedSurcharge);
    }
  }
});

test("each meat costs $1 and additional ingredients use the recovered matrix", () => {
  const meats = catalog.optionGroups.find((group) => group.id === "meats").options;
  for (const meat of meats) {
    assert.equal(
      calculateUnitPrice(catalog, "pepperoni-pizza", {
        ...basicSelections,
        meats: [meat.id],
      }),
      899,
    );
  }

  const ingredients = catalog.optionGroups.find(
    (group) => group.id === "additional-ingredients",
  ).options;
  for (const ingredient of ingredients) {
    assert.equal(
      calculateUnitPrice(catalog, "pepperoni-pizza", {
        ...basicSelections,
        "additional-ingredients": [ingredient.id],
      }),
      799 + ingredient.surchargeCents,
    );
  }
});

test("Margherita tomatoes are free while tomatoes cost $1 on other products", () => {
  const selections = {
    ...basicSelections,
    "additional-ingredients": ["tomatoes"],
  };
  assert.equal(calculateUnitPrice(catalog, "margherita-pizza", selections), 1099);
  assert.equal(calculateUnitPrice(catalog, "pepperoni-pizza", selections), 899);
});

test("option surcharge resolver exposes product overrides for UI display", () => {
  const group = catalog.optionGroups.find((item) => item.id === "additional-ingredients");
  const tomatoes = group.options.find((item) => item.id === "tomatoes");
  const margherita = catalog.products.find((item) => item.id === "margherita-pizza");
  const pepperoni = catalog.products.find((item) => item.id === "pepperoni-pizza");
  assert.equal(getOptionSurchargeCents(margherita, group, tomatoes), 0);
  assert.equal(getOptionSurchargeCents(pepperoni, group, tomatoes), 100);
});

test("multiple toppings accumulate and the recovered $22.99 x 10 fixture passes", () => {
  const historicalSelections = {
    size: "large-16",
    crust: "deep-dish",
    sauce: "alfredo",
    cheese: "cheddar",
    meats: [
      "pepperoni",
      "chicken",
      "ham",
      "hamburger",
      "italian-sausage",
      "bacon",
    ],
    "additional-ingredients": ["artichoke", "bell-peppers"],
  };
  const result = calculateLineTotal(catalog, {
    productId: "pepperoni-pizza",
    selections: historicalSelections,
    quantity: 10,
  });
  assert.deepEqual(result, {
    unitPriceCents: 2299,
    quantity: 10,
    lineTotalCents: 22990,
  });
});

test("quantity defaults to 1 and accepts the inclusive 1-20 range", () => {
  assert.equal(validateQuantity(), 1);
  assert.equal(validateQuantity(1), 1);
  assert.equal(validateQuantity(20), 20);
  assert.equal(
    calculateLineTotal(catalog, {
      productId: "build-your-own-pizza",
      selections: basicSelections,
    }).lineTotalCents,
    599,
  );
});

test("empty, non-integer, zero, negative, and over-limit quantities are rejected", () => {
  for (const invalid of ["", "1", 1.5, 0, -1, 21, null]) {
    expectCode("INVALID_QUANTITY", () => validateQuantity(invalid));
  }
});

test("unknown products, groups, and options are rejected with specific codes", () => {
  expectCode("UNKNOWN_PRODUCT", () =>
    validateConfiguration(catalog, "database-product-42", basicSelections),
  );
  expectCode("UNKNOWN_GROUP", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      mystery: "value",
    }),
  );
  expectCode("UNKNOWN_OPTION", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      crust: "stuffed",
    }),
  );
});

test("wrong-group, missing, duplicate, multiple, and malformed selections are rejected", () => {
  expectCode("OPTION_IN_WRONG_GROUP", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      crust: "mozzarella",
    }),
  );
  const { cheese: omitted, ...missingCheese } = basicSelections;
  expectCode("MISSING_REQUIRED_GROUP", () =>
    validateConfiguration(catalog, "pepperoni-pizza", missingCheese),
  );
  expectCode("DUPLICATE_SELECTION", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      cheese: ["cheddar", "cheddar"],
    }),
  );
  expectCode("MULTIPLE_SINGLE_SELECTIONS", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      sauce: ["traditional", "alfredo"],
    }),
  );
  expectCode("DUPLICATE_SELECTION", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      meats: ["ham", "ham"],
    }),
  );
  expectCode("MALFORMED_SELECTION", () =>
    validateConfiguration(catalog, "pepperoni-pizza", {
      ...basicSelections,
      meats: "ham",
    }),
  );
  expectCode("MALFORMED_SELECTIONS", () =>
    validateConfiguration(catalog, "pepperoni-pizza", null),
  );
});

test("identity normalizes optional selection order and distinguishes real differences", () => {
  const first = {
    ...basicSelections,
    meats: ["ham", "bacon"],
    "additional-ingredients": ["onions", "black-olives"],
  };
  const reordered = {
    ...basicSelections,
    meats: ["bacon", "ham"],
    "additional-ingredients": ["black-olives", "onions"],
  };
  const different = { ...reordered, crust: "thin" };

  assert.equal(
    createConfigurationIdentity(catalog, "pepperoni-pizza", first),
    createConfigurationIdentity(catalog, "pepperoni-pizza", reordered),
  );
  assert.notEqual(
    createConfigurationIdentity(catalog, "pepperoni-pizza", first),
    createConfigurationIdentity(catalog, "pepperoni-pizza", different),
  );
  assert.notEqual(
    createConfigurationIdentity(catalog, "pepperoni-pizza", first),
    createConfigurationIdentity(catalog, "vegetarian-pizza", first),
  );
});

test("cart subtotal recalculates each line and ignores supplied prices and totals", () => {
  const subtotal = calculateCartSubtotal(catalog, [
    {
      productId: "build-your-own-pizza",
      selections: basicSelections,
      quantity: 2,
      unitPriceCents: 1,
      lineTotalCents: 2,
    },
    {
      productId: "margherita-pizza",
      selections: {
        ...basicSelections,
        size: "medium-14",
        "additional-ingredients": ["tomatoes", "artichoke"],
      },
      quantity: 1,
      unitPriceCents: 1,
      lineTotalCents: 1,
    },
  ]);

  assert.equal(subtotal, 1198 + 1399);
  assert.equal(calculateCartSubtotal(catalog, []), 0);
  expectCode("INVALID_CART", () => calculateCartSubtotal(catalog, {}));
});

test("local catalog service is asynchronous, thin, and returns current catalog data", async () => {
  const service = createLocalCatalogService();
  assert.equal(await service.getVersion(), catalog.schemaVersion);
  assert.equal((await service.listProducts()).length, 6);
  assert.equal((await service.listOptionGroups()).length, 6);
  assert.equal((await service.getProduct("artichoke-pizza")).label, "Artichoke Pizza");
  assert.equal(await service.getProduct("missing"), null);
});
