exports.up = async (knex) => {
  await knex.schema.createTable('expiry_records', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops');
    t.uuid('product_id').notNullable();
    t.string('product_name').notNullable();
    t.string('sku', 100);
    t.string('batch_no', 100);
    t.date('expiry_date').notNullable();
    t.date('manufacturing_date').nullable();
    t.decimal('qty', 14, 3).notNullable();
    t.string('location', 100);
    t.string('status', 20).notNullable().defaultTo('active'); // active, near_expiry, expired, disposed
    t.date('disposed_at').nullable();
    t.decimal('disposed_qty', 14, 3).defaultTo(0);
    t.text('notes');
    t.uuid('created_by').references('id').inTable('users');
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('expiry_records');
};
