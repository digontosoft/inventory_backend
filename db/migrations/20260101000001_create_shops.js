exports.up = (knex) =>
  knex.schema.createTable('shops', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();
  });

exports.down = (knex) => knex.schema.dropTable('shops');
