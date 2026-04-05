exports.up = (knex) =>
  knex.schema.createTable('units', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('abbreviation').notNullable();
    t.text('description').nullable();
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();

    t.unique(['shop_id', 'abbreviation']);
  });

exports.down = (knex) => knex.schema.dropTable('units');
