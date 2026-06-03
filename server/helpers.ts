// Pure, side-effect-free helpers shared by the API layer.
// Kept separate from api.ts so they can be unit-tested without booting Express or the DB.

/**
 * Returns true when a form's data references a given target document id
 * through any of the known reference fields used across departments.
 */
export const matchesReference = (formData: any, targetId: string): boolean => {
  if (!formData || !targetId) return false;
  return (
    formData.referenceDocument === targetId ||
    formData.poNumber === targetId ||
    formData.reference === targetId ||
    formData.sourceDocumentNo === targetId ||
    formData.productionOrderNo === targetId ||
    formData.productionOrderId === targetId
  );
};

/**
 * Builds a unique inventory-transaction id of the form `<type>-<ms>-<rand>`.
 */
export const buildTransactionId = (type: string): string =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
