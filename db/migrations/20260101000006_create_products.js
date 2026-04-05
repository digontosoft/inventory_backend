exports.up = (knex) =>
  knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shop_id').notNullable().references('id').inTable('shops').onDelete('CASCADE');
    t.uuid('category_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
    t.uuid('unit_id').nullable().references('id').inTable('units').onDelete('SET NULL');
    t.string('name').notNullable();
    t.string('sku').notNullable();
    t.string('barcode').nullable();
    t.decimal('purchase_price', 12, 2).notNullable().defaultTo(0);
    t.decimal('selling_price', 12, 2).notNullable().defaultTo(0);
    t.decimal('vat_rate', 5, 2).notNullable().defaultTo(0);
    t.integer('stock').notNullable().defaultTo(0);
    t.integer('low_stock_threshold').notNullable().defaultTo(0);
    t.text('image').nullable();
    t.text('description').nullable();
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();

    t.unique(['shop_id', 'sku']);
  });

exports.down = (knex) => knex.schema.dropTable('products');
