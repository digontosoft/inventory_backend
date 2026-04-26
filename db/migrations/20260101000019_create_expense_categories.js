exports.up = (knex) =>
  knex.schema.createTable('expense_categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('icon').notNullable().defaultTo('📋');
    t.text('description').nullable();
    t.decimal('budget_monthly', 12, 2).notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);

    t.unique(['shop_id', 'name']);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('expense_categories');
