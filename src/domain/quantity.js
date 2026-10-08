import { DomainValidationError } from "./errors.js";

export function validateQuantity(quantity = 1, maximum = 20) {
  if (!Number.isInteger(quantity)) {
    throw new DomainValidationError(
      "INVALID_QUANTITY",
      `Quantity must be an integer from 1 through ${maximum}.`,
      { quantity, maximum },
    );
  }

  if (quantity < 1 || quantity > maximum) {
    throw new DomainValidationError(
      "INVALID_QUANTITY",
      `Quantity must be from 1 through ${maximum}.`,
      { quantity, maximum },
    );
  }

  return quantity;
}

