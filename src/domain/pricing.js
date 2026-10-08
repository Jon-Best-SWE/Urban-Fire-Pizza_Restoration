import { validateConfiguration } from "./configuration.js";
import { validateQuantity } from "./quantity.js";

export function getOptionSurchargeCents(product, group, option) {
  return product.surchargeOverrides?.[group.id]?.[option.id] ?? option.surchargeCents;
}

export function calculateUnitPrice(catalog, productId, selections) {
  const validated = validateConfiguration(catalog, productId, selections);
  let surchargeCents = 0;

  for (const group of catalog.optionGroups) {
    const selectedIds = Array.isArray(validated.selections[group.id])
      ? validated.selections[group.id]
      : [validated.selections[group.id]];

    for (const optionId of selectedIds) {
      const option = group.options.find((candidate) => candidate.id === optionId);
      surchargeCents += getOptionSurchargeCents(validated.product, group, option);
    }
  }

  return validated.product.basePriceCents + surchargeCents;
}

export function calculateLineTotal(catalog, line) {
  const quantity = validateQuantity(line?.quantity, catalog.maximumLineQuantity);
  const unitPriceCents = calculateUnitPrice(
    catalog,
    line?.productId,
    line?.selections,
  );
  return { unitPriceCents, quantity, lineTotalCents: unitPriceCents * quantity };
}
