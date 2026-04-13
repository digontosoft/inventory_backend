exports.up = async (knex) => {
  await knex.schema.createTable('stock_adjustments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops');
    t.string('adjustment_no', 20).notNullable();
    t.date('date').notNullable();
    t.string('reason', 50).notNullable(); // damage, loss, theft, found, correction, expiry, other
    t.text('reason_note');
    t.decimal('total_value_impact', 14, 2).notNullable().defaultTo(0);
    t.string('status', 20).notNullable().defaultTo('draft'); // draft, approved
    t.text('notes');
    t.uuid('created_by').references('id').inTable('users');
    t.uuid('approved_by').references('id').inTable('users').nullable();
    t.timestamps(true, true);
    t.unique(['shop_id', 'adjustment_no']);
  });

  await knex.schema.createTable('stock_adjustment_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('adjustment_id').notNullable().references('id').inTable('stock_adjustments').onDelete('CASCADE');
    t.uuid('product_id').notNullable();
    t.string('product_name').notNullable();
    t.string('sku', 100);
    t.string('unit', 50);
    t.decimal('current_stock', 14, 3).notNullable();
    t.decimal('adjusted_qty', 14, 3).notNullable();
    t.decimal('difference', 14, 3).notNullable();
    t.decimal('unit_cost', 14, 2).notNullable().defaultTo(0);
    t.decimal('value_impact', 14, 2).notNullable().defaultTo(0);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('stock_adjustment_items');
  await knex.schema.dropTableIfExists('stock_adjustments');
};
