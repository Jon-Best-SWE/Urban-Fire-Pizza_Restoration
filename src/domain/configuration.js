import { DomainValidationError } from "./errors.js";

function findProduct(catalog, productId) {
  const product = catalog.products.find((candidate) => candidate.id === productId);
  if (!product) {
    throw new DomainValidationError(
      "UNKNOWN_PRODUCT",
      `Unknown product ID: ${String(productId)}.`,
      { productId },
    );
  }
  return product;
}

function optionOwner(catalog, optionId) {
  return catalog.optionGroups.find((group) =>
    group.options.some((option) => option.id === optionId),
  );
}

function validateOption(catalog, group, optionId) {
  if (typeof optionId !== "string" || optionId.length === 0) {
    throw new DomainValidationError(
      "MALFORMED_SELECTION",
      `Group ${group.id} must contain non-empty option IDs.`,
      { groupId: group.id, optionId },
    );
  }

  const option = group.options.find((candidate) => candidate.id === optionId);
  if (option) return option;

  const owner = optionOwner(catalog, optionId);
  if (owner) {
    throw new DomainValidationError(
      "OPTION_IN_WRONG_GROUP",
      `Option ${optionId} belongs to ${owner.id}, not ${group.id}.`,
      { groupId: group.id, optionId, expectedGroupId: owner.id },
    );
  }

  throw new DomainValidationError(
    "UNKNOWN_OPTION",
    `Unknown option ID ${optionId} in group ${group.id}.`,
    { groupId: group.id, optionId },
  );
}

export function validateConfiguration(catalog, productId, selections) {
  const product = findProduct(catalog, productId);
  if (!selections || typeof selections !== "object" || Array.isArray(selections)) {
    throw new DomainValidationError(
      "MALFORMED_SELECTIONS",
      "Selections must be an object keyed by option-group ID.",
    );
  }

  const groupIds = new Set(catalog.optionGroups.map((group) => group.id));
  for (const groupId of Object.keys(selections)) {
    if (!groupIds.has(groupId)) {
      throw new DomainValidationError(
        "UNKNOWN_GROUP",
        `Unknown option-group ID: ${groupId}.`,
        { groupId },
      );
    }
  }

  const normalizedSelections = {};
  for (const group of catalog.optionGroups) {
    const value = selections[group.id];

    if (group.selection === "single") {
      if (value === undefined || value === null || value === "") {
        throw new DomainValidationError(
          "MISSING_REQUIRED_GROUP",
          `A selection is required for ${group.id}.`,
          { groupId: group.id },
        );
      }
      if (Array.isArray(value)) {
        const duplicate = value.length > 1 && new Set(value).size !== value.length;
        throw new DomainValidationError(
          duplicate ? "DUPLICATE_SELECTION" : "MULTIPLE_SINGLE_SELECTIONS",
          `Group ${group.id} requires exactly one option ID, not an array.`,
          { groupId: group.id, value },
        );
      }
      validateOption(catalog, group, value);
      normalizedSelections[group.id] = value;
      continue;
    }

    if (value === undefined) {
      normalizedSelections[group.id] = [];
      continue;
    }
    if (!Array.isArray(value)) {
      throw new DomainValidationError(
        "MALFORMED_SELECTION",
        `Group ${group.id} requires an array of option IDs.`,
        { groupId: group.id, value },
      );
    }
    if (new Set(value).size !== value.length) {
      throw new DomainValidationError(
        "DUPLICATE_SELECTION",
        `Group ${group.id} contains a duplicate option ID.`,
        { groupId: group.id, value },
      );
    }
    value.forEach((optionId) => validateOption(catalog, group, optionId));
    normalizedSelections[group.id] = [...value].sort();
  }

  return { product, selections: normalizedSelections };
}

export function createConfigurationIdentity(catalog, productId, selections) {
  const validated = validateConfiguration(catalog, productId, selections);
  return JSON.stringify({
    catalogVersion: catalog.schemaVersion,
    productId: validated.product.id,
    selections: validated.selections,
  });
}

