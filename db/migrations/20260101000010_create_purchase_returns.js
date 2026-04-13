exports.up = (knex) =>
  knex.schema
    .createTable('purchase_returns', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
      t.uuid('purchase_id').nullable().references('id').inTable('purchases').onDelete('SET NULL');
      t.uuid('supplier_id').nullable().references('id').inTable('suppliers').onDelete('SET NULL');
      t.string('return_no').notNullable();
      t.string('supplier_name').notNullable();
      t.date('date').notNullable();
      t.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
      t.text('reason').notNullable();
      t.enum('status', ['completed', 'pending']).notNullable().defaultTo('completed');
      t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);

      t.unique(['shop_id', 'return_no']);
    })
    .createTable('purchase_return_items', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('return_id').notNullable().references('id').inTable('purchase_returns').onDelete('CASCADE');
      t.uuid('product_id').nullable().references('id').inTable('products').onDelete('SET NULL');
      t.string('product_name').notNullable();
      t.decimal('qty', 12, 2).notNullable().defaultTo(1);
      t.decimal('purchase_price', 12, 2).notNullable().defaultTo(0);
      t.decimal('line_total', 12, 2).notNullable().defaultTo(0);
    });

exports.down = (knex) =>
  knex.schema
    .dropTableIfExists('purchase_return_items')
    .dropTableIfExists('purchase_returns');
