/**
 * Shared helpers for updating per-location stock and keeping products.stock
 * in sync as a cached total across all locations.
 */

/**
 * Get the default location for a shop.
 * Throws if no default location exists.
 */
async function getDefaultLocation(trx, shopId) {
  const loc = await trx('locations')
    .where({ shop_id: shopId, is_default: true, is_active: true })
    .select('id', 'name')
    .first();
  if (!loc) throw new Error('No default location found for this shop');
  return loc;
}

/**
 * Ensure a product_location_stocks row exists, then apply a delta (+ or -).
 * After updating the row, recompute products.stock as the sum of all locations.
 */
async function incrementLocationStock(trx, { productId, locationId, shopId, delta }) {
  // upsert the per-location row
  const existing = await trx('product_location_stocks')
    .where({ product_id: productId, location_id: locationId })
    .first();

  if (existing) {
    await trx('product_location_stocks')
      .where({ product_id: productId, location_id: locationId })
      .increment('qty', delta);
  } else {
    const qty = Math.max(0, delta); // don't go negative on first insert
    await trx('product_location_stocks').insert({
      shop_id:     shopId,
      product_id:  productId,
      location_id: locationId,
      qty,
    });
  }

  await syncProductTotalStock(trx, productId);
}

/**
 * Set the absolute qty for a product at a specific location.
 * After setting, recompute products.stock as the sum of all locations.
 */
async function setLocationStock(trx, { productId, locationId, shopId, qty }) {
  const existing = await trx('product_location_stocks')
    .where({ product_id: productId, location_id: locationId })
    .first();

  if (existing) {
    await trx('product_location_stocks')
      .where({ product_id: productId, location_id: locationId })
      .update({ qty });
  } else {
    await trx('product_location_stocks').insert({
      shop_id:     shopId,
      product_id:  productId,
      location_id: locationId,
      qty,
    });
  }

  await syncProductTotalStock(trx, productId);
}

/**
 * Recompute products.stock as the SUM of qty across all product_location_stocks rows.
 */
async function syncProductTotalStock(trx, productId) {
  const result = await trx('product_location_stocks')
    .where({ product_id: productId })
    .sum('qty as total')
    .first();

  const total = parseInt(result.total) || 0;
  await trx('products').where({ id: productId }).update({ stock: total });
}

/**
 * Get stock for a specific product at a specific location (returns 0 if not found).
 */
async function getLocationStock(trx, { productId, locationId }) {
  const row = await trx('product_location_stocks')
    .where({ product_id: productId, location_id: locationId })
    .select('qty')
    .first();
  return row ? parseInt(row.qty) : 0;
}

module.exports = {
  getDefaultLocation,
  incrementLocationStock,
  setLocationStock,
  syncProductTotalStock,
  getLocationStock,
};
