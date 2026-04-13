exports.up = async (knex) => {
  await knex.schema.createTable('stock_counts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops');
    t.string('count_no', 20).notNullable();
    t.string('title').notNullable();
    t.string('type', 20).notNullable().defaultTo('full'); // full, category
    t.text('category_filter'); // comma-separated category IDs
    t.date('date').notNullable();
    t.string('status', 20).notNullable().defaultTo('in_progress'); // in_progress, approved
    t.decimal('total_system_value', 14, 2).notNullable().defaultTo(0);
    t.decimal('total_counted_value', 14, 2).notNullable().defaultTo(0);
    t.decimal('total_variance_value', 14, 2).notNullable().defaultTo(0);
    t.integer('total_items_to_count').notNullable().defaultTo(0);
    t.integer('total_items_counted').notNullable().defaultTo(0);
    t.text('notes');
    t.uuid('created_by').references('id').inTable('users');
    t.timestamp('completed_at').nullable();
    t.timestamps(true, true);
    t.unique(['shop_id', 'count_no']);
  });

  await knex.schema.createTable('stock_count_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('count_id').notNullable().references('id').inTable('stock_counts').onDelete('CASCADE');
    t.uuid('product_id').notNullable();
    t.string('product_name').notNullable();
    t.string('sku', 100);
    t.string('unit', 50);
    t.string('category', 100);
    t.decimal('system_qty', 14, 3).notNullable();
    t.decimal('counted_qty', 14, 3).nullable();
    t.decimal('difference', 14, 3).notNullable().defaultTo(0);
    t.decimal('unit_cost', 14, 2).notNullable().defaultTo(0);
    t.decimal('value_variance', 14, 2).notNullable().defaultTo(0);
    t.string('status', 20).notNullable().defaultTo('pending'); // pending, counted, verified
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('stock_count_items');
  await knex.schema.dropTableIfExists('stock_counts');
};
