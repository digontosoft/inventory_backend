exports.up = (knex) =>
  knex.schema.createTable('supplier_payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.uuid('supplier_id').nullable().references('id').inTable('suppliers').onDelete('SET NULL');
    t.string('payment_no').notNullable();
    t.string('supplier_name').notNullable();
    t.date('date').notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.enum('payment_method', ['cash', 'bkash', 'bank', 'cheque']).notNullable().defaultTo('cash');
    t.string('reference_no').nullable();
    t.text('notes').nullable();
    t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);

    t.unique(['shop_id', 'payment_no']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('supplier_payments');
