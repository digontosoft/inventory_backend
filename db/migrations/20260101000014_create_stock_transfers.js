exports.up = async (knex) => {
  await knex.schema.createTable('stock_transfers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops');
    t.string('transfer_no', 20).notNullable();
    t.date('date').notNullable();
    t.date('expected_date');
    t.string('from_branch', 100).notNullable();
    t.string('to_branch', 100).notNullable();
    t.integer('total_items').notNullable().defaultTo(0);
    t.string('status', 20).notNullable().defaultTo('draft'); // draft, dispatched, received, partial, cancelled
    t.date('dispatched_at');
    t.date('received_at');
    t.text('notes');
    t.uuid('created_by').references('id').inTable('users');
    t.string('created_by_name', 100);
    t.timestamps(true, true);
    t.unique(['shop_id', 'transfer_no']);
  });

  await knex.schema.createTable('stock_transfer_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('transfer_id').notNullable().references('id').inTable('stock_transfers').onDelete('CASCADE');
    t.uuid('product_id').notNullable();
    t.string('product_name').notNullable();
    t.string('sku', 100);
    t.string('unit', 50);
    t.decimal('qty_requested', 14, 3).notNullable();
    t.decimal('qty_sent', 14, 3).notNullable().defaultTo(0);
    t.decimal('qty_received', 14, 3).notNullable().defaultTo(0);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('stock_transfer_items');
  await knex.schema.dropTableIfExists('stock_transfers');
};
