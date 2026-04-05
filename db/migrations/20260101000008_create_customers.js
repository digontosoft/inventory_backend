exports.up = (knex) =>
  knex.schema.createTable('customers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('phone').nullable();
    t.enum('type', ['Retail', 'Wholesale']).notNullable().defaultTo('Retail');
    t.text('address').nullable();
    t.boolean('custom_price').notNullable().defaultTo(false);
    t.decimal('credit_limit', 12, 2).notNullable().defaultTo(0);
    t.decimal('opening_balance', 12, 2).notNullable().defaultTo(0);
    t.decimal('total_sales', 12, 2).notNullable().defaultTo(0);
    t.decimal('due_balance', 12, 2).notNullable().defaultTo(0);
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();
  });

exports.down = (knex) => knex.schema.dropTable('customers');
