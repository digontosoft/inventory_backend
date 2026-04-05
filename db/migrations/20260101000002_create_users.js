exports.up = (knex) =>
  knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password').notNullable();
    t.string('phone').nullable();
    t.enum('role', ['owner', 'admin', 'staff']).notNullable().defaultTo('owner');
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();
  });

exports.down = (knex) => knex.schema.dropTable('users');
