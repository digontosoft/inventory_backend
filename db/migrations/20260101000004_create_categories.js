exports.up = (knex) =>
  knex.schema.createTable('categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name').notNullable();
    t.text('description').nullable();
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();

    t.unique(['shop_id', 'name']);
  });

exports.down = (knex) => knex.schema.dropTable('categories');
