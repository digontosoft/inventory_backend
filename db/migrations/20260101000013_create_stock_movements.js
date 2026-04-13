exports.up = async (knex) => {
  await knex.schema.createTable('stock_movements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops');
    t.date('date').notNullable();
    t.string('time', 20);
    t.uuid('product_id').notNullable();
    t.string('product_name').notNullable();
    t.string('sku', 100);
    t.string('type', 50).notNullable(); // purchase_in, sale_out, adjustment_in, adjustment_out, transfer_in, transfer_out, return_in, return_out, opening_stock, count_adjustment
    t.string('reference_type', 50);
    t.uuid('reference_id').nullable();
    t.string('reference_no', 50);
    t.decimal('qty_before', 14, 3).notNullable();
    t.decimal('qty_change', 14, 3).notNullable();
    t.decimal('qty_after', 14, 3).notNullable();
    t.decimal('unit_cost', 14, 2).defaultTo(0);
    t.decimal('total_value', 14, 2).defaultTo(0);
    t.string('location', 100);
    t.text('notes');
    t.string('created_by_name', 100);
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('stock_movements');
};
