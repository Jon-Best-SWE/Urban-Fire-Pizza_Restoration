import { DomainValidationError } from "./errors.js";
import { calculateLineTotal } from "./pricing.js";

export function calculateCartSubtotal(catalog, lines) {
  if (!Array.isArray(lines)) {
    throw new DomainValidationError("INVALID_CART", "Cart lines must be an array.");
  }

  return lines.reduce(
    (subtotalCents, line) =>
      subtotalCents + calculateLineTotal(catalog, line).lineTotalCents,
    0,
  );
}

