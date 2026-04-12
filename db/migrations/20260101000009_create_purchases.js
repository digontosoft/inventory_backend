exports.up = (knex) =>
  knex.schema
    .createTable('purchases', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
      t.uuid('supplier_id').nullable().references('id').inTable('suppliers').onDelete('SET NULL');
      t.string('invoice_no').notNullable();
      t.string('supplier_name').notNullable();
      t.date('date').notNullable();
      t.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
      t.decimal('total_discount', 12, 2).notNullable().defaultTo(0);
      t.decimal('total_vat', 12, 2).notNullable().defaultTo(0);
      t.decimal('freight_cost', 12, 2).notNullable().defaultTo(0);
      t.decimal('grand_total', 12, 2).notNullable().defaultTo(0);
      t.enum('payment_method', ['cash', 'credit', 'bkash', 'bank']).notNullable().defaultTo('cash');
      t.decimal('amount_paid', 12, 2).notNullable().defaultTo(0);
      t.decimal('due_amount', 12, 2).notNullable().defaultTo(0);
      t.enum('status', ['draft', 'received', 'partial', 'returned']).notNullable().defaultTo('draft');
      t.text('notes').nullable();
      t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.timestamp('deleted_at').nullable();

      t.unique(['shop_id', 'invoice_no']);
    })
    .createTable('purchase_items', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('purchase_id').notNullable().references('id').inTable('purchases').onDelete('CASCADE');
      t.uuid('product_id').nullable().references('id').inTable('products').onDelete('SET NULL');
      t.string('product_name').notNullable();
      t.string('unit').notNullable().defaultTo('');
      t.decimal('qty', 12, 2).notNullable().defaultTo(1);
      t.decimal('purchase_price', 12, 2).notNullable().defaultTo(0);
      t.decimal('discount', 5, 2).notNullable().defaultTo(0);
      t.decimal('vat_rate', 5, 2).notNullable().defaultTo(0);
      t.decimal('vat_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('line_total', 12, 2).notNullable().defaultTo(0);
    });

exports.down = (knex) =>
  knex.schema.dropTableIfExists('purchase_items').dropTableIfExists('purchases');
