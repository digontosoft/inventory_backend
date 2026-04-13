exports.up = async function (knex) {
  // ── locations table ────────────────────────────────────────────────────────
  await knex.schema.createTable('locations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.text('address').nullable();
    t.string('phone', 30).nullable();
    t.boolean('is_default').notNullable().defaultTo(false);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.index('shop_id');
  });

  // ── product_location_stocks table ─────────────────────────────────────────
  await knex.schema.createTable('product_location_stocks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.uuid('location_id').notNullable().references('id').inTable('locations').onDelete('CASCADE');
    t.integer('qty').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.unique(['product_id', 'location_id']);
    t.index('shop_id');
    t.index('location_id');
  });

  // ── seed: one default "Main Warehouse" per existing shop ──────────────────
  const shops = await knex('shops').select('id');
  for (const shop of shops) {
    const [loc] = await knex('locations').insert({
      shop_id:    shop.id,
      name:       'Main Warehouse',
      is_default: true,
      is_active:  true,
    }).returning('id');

    const locationId = loc.id ?? loc;

    // migrate existing product.stock into this default location
    const products = await knex('products').where({ shop_id: shop.id }).select('id', 'stock');
    if (products.length > 0) {
      const rows = products.map((p) => ({
        shop_id:     shop.id,
        product_id:  p.id,
        location_id: locationId,
        qty:         p.stock || 0,
      }));
      await knex('product_location_stocks').insert(rows);
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_location_stocks');
  await knex.schema.dropTableIfExists('locations');
};
