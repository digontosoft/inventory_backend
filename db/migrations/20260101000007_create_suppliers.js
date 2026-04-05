exports.up = (knex) =>
  knex.schema.createTable('suppliers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('phone').nullable();
    t.string('email').nullable();
    t.text('address').nullable();
    t.string('payment_terms').nullable();
    t.decimal('opening_balance', 12, 2).notNullable().defaultTo(0);
    t.decimal('total_purchases', 12, 2).notNullable().defaultTo(0);
    t.decimal('due_balance', 12, 2).notNullable().defaultTo(0);
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();
  });

exports.down = (knex) => knex.schema.dropTable('suppliers');
