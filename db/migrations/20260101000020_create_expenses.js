exports.up = (knex) =>
  knex.schema.createTable('expenses', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('expense_no').notNullable();
    t.date('date').notNullable();
    t.uuid('category_id').nullable().references('id').inTable('expense_categories').onDelete('SET NULL');
    t.string('category_name').notNullable().defaultTo('');
    t.text('description').notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.enum('payment_method', ['cash', 'bkash', 'bank']).notNullable().defaultTo('cash');
    t.string('reference_no').nullable();
    t.enum('status', ['paid', 'pending']).notNullable().defaultTo('paid');
    t.text('notes').nullable();
    t.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('deleted_at').nullable();
    t.timestamps(true, true);

    t.unique(['shop_id', 'expense_no']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('expenses');
