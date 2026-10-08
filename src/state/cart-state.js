import { DomainValidationError } from "../domain/errors.js";
import { createConfigurationIdentity, validateConfiguration } from "../domain/configuration.js";
import { validateQuantity } from "../domain/quantity.js";

function cartError(code, message, details = {}) {
  return new DomainValidationError(code, message, details);
}

export function normalizeCartLine(catalog, line) {
  const validated = validateConfiguration(catalog, line?.productId, line?.selections);
  const quantity = validateQuantity(line?.quantity, catalog.maximumLineQuantity);
  return {
    id: createConfigurationIdentity(catalog, validated.product.id, validated.selections),
    productId: validated.product.id,
    selections: validated.selections,
    quantity,
  };
}

export function addCartLine(catalog, lines, candidate) {
  const normalized = normalizeCartLine(catalog, candidate);
  const existingIndex = lines.findIndex((line) => normalizeCartLine(catalog, line).id === normalized.id);
  if (existingIndex < 0) return [...lines.map((line) => normalizeCartLine(catalog, line)), normalized];

  const next = lines.map((line) => normalizeCartLine(catalog, line));
  const mergedQuantity = next[existingIndex].quantity + normalized.quantity;
  if (mergedQuantity > catalog.maximumLineQuantity) {
    throw cartError("CART_QUANTITY_LIMIT", `That configuration already has ${next[existingIndex].quantity} in the cart. The maximum is ${catalog.maximumLineQuantity}.`, { maximum: catalog.maximumLineQuantity });
  }
  next[existingIndex] = { ...next[existingIndex], quantity: mergedQuantity };
  return next;
}

export function replaceCartLine(catalog, lines, lineId, candidate) {
  const normalizedLines = lines.map((line) => normalizeCartLine(catalog, line));
  const targetIndex = normalizedLines.findIndex((line) => line.id === lineId);
  if (targetIndex < 0) throw cartError("CART_LINE_NOT_FOUND", "The cart item could not be found.", { lineId });
  const replacement = normalizeCartLine(catalog, candidate);
  const withoutTarget = normalizedLines.filter((_, index) => index !== targetIndex);
  return addCartLine(catalog, withoutTarget, replacement);
}

export function setCartLineQuantity(catalog, lines, lineId, quantity) {
  const normalizedLines = lines.map((line) => normalizeCartLine(catalog, line));
  const targetIndex = normalizedLines.findIndex((line) => line.id === lineId);
  if (targetIndex < 0) throw cartError("CART_LINE_NOT_FOUND", "The cart item could not be found.", { lineId });
  const next = [...normalizedLines];
  next[targetIndex] = { ...next[targetIndex], quantity: validateQuantity(quantity, catalog.maximumLineQuantity) };
  return next;
}

export function removeCartLine(catalog, lines, lineId) {
  const normalizedLines = lines.map((line) => normalizeCartLine(catalog, line));
  if (!normalizedLines.some((line) => line.id === lineId)) throw cartError("CART_LINE_NOT_FOUND", "The cart item could not be found.", { lineId });
  return normalizedLines.filter((line) => line.id !== lineId);
}

export function countCartItems(lines) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

