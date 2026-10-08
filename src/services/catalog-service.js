import { catalog } from "../data/catalog.js";

/** A thin local adapter matching the catalog service boundary. */
export function createLocalCatalogService(sourceCatalog = catalog) {
  return Object.freeze({
    getCatalog: async () => sourceCatalog,
    getVersion: async () => sourceCatalog.schemaVersion,
    listProducts: async () => sourceCatalog.products,
    getProduct: async (productId) =>
      sourceCatalog.products.find((product) => product.id === productId) ?? null,
    listOptionGroups: async () => sourceCatalog.optionGroups,
  });
}

export const catalogService = createLocalCatalogService();

