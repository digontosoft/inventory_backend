exports.up = async function (knex) {
  // purchases
  await knex.schema.table('purchases', (t) => {
    t.uuid('location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // purchase_returns
  await knex.schema.table('purchase_returns', (t) => {
    t.uuid('location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // stock_adjustments
  await knex.schema.table('stock_adjustments', (t) => {
    t.uuid('location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // stock_movements
  await knex.schema.table('stock_movements', (t) => {
    t.uuid('location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // stock_transfers: from and to locations
  await knex.schema.table('stock_transfers', (t) => {
    t.uuid('from_location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
    t.uuid('to_location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // stock_counts
  await knex.schema.table('stock_counts', (t) => {
    t.uuid('location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // expiry_records
  await knex.schema.table('expiry_records', (t) => {
    t.uuid('location_id').nullable().references('id').inTable('locations').onDelete('SET NULL');
  });

  // ── back-fill: assign default location to all existing rows ───────────────
  const shops = await knex('shops').select('id');
  for (const shop of shops) {
    const loc = await knex('locations')
      .where({ shop_id: shop.id, is_default: true })
      .select('id')
      .first();
    if (!loc) continue;
    const lid = loc.id;

    await knex('purchases').where({ shop_id: shop.id }).update({ location_id: lid });
    await knex('purchase_returns').where({ shop_id: shop.id }).update({ location_id: lid });
    await knex('stock_adjustments').where({ shop_id: shop.id }).update({ location_id: lid });
    await knex('stock_movements').where({ shop_id: shop.id }).update({ location_id: lid });
    await knex('stock_transfers').where({ shop_id: shop.id }).update({ from_location_id: lid, to_location_id: lid });
    await knex('stock_counts').where({ shop_id: shop.id }).update({ location_id: lid });
    await knex('expiry_records').where({ shop_id: shop.id }).update({ location_id: lid });
  }
};

exports.down = async function (knex) {
  await knex.schema.table('purchases',         (t) => { t.dropColumn('location_id'); });
  await knex.schema.table('purchase_returns',  (t) => { t.dropColumn('location_id'); });
  await knex.schema.table('stock_adjustments', (t) => { t.dropColumn('location_id'); });
  await knex.schema.table('stock_movements',   (t) => { t.dropColumn('location_id'); });
  await knex.schema.table('stock_transfers',   (t) => { t.dropColumn('from_location_id'); t.dropColumn('to_location_id'); });
  await knex.schema.table('stock_counts',      (t) => { t.dropColumn('location_id'); });
  await knex.schema.table('expiry_records',    (t) => { t.dropColumn('location_id'); });
};
