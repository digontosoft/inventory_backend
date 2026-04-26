exports.up = (knex) =>
  knex.schema.createTable('cash_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('transaction_no').notNullable();
    t.date('date').notNullable();
    t.string('time').notNullable().defaultTo('00:00');
    t.enum('type', ['in', 'out']).notNullable();
    t.string('category').notNullable().defaultTo('other');
    t.string('reference_type').notNullable().defaultTo('manual');
    t.string('reference_id').nullable();
    t.string('reference_no').nullable();
    t.text('description').notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.enum('payment_method', ['cash', 'bkash', 'bank']).notNullable().defaultTo('cash');
    t.decimal('balance', 12, 2).notNullable().defaultTo(0);
    t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);

    t.unique(['shop_id', 'transaction_no']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('cash_transactions');
