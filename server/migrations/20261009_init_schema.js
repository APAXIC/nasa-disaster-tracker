exports.up = async function(knex) {
  // Enable PostGIS Extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis;');

  // Users Table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamps(true, true);
  });

  // Events Table
  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('nasa_id').unique().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.string('link');
    table.timestamp('closed_at');
    // PostGIS Geography Point column (SRID 4326 for standard Lat/Lng)
    table.specificType('latest_location', 'GEOGRAPHY(Point, 4326)').notNullable();
    table.timestamp('last_synced_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  // Spatial Index on Events Location
  await knex.raw('CREATE INDEX idx_events_latest_location ON events USING GIST(latest_location);');

  // Event Geometries (Historical trajectory points)
  await knex.schema.createTable('event_geometries', (table) => {
    table.increments('id').primary();
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.timestamp('recorded_at').notNullable();
    table.specificType('location', 'GEOGRAPHY(Point, 4326)').notNullable();
    table.float('magnitude_value');
    table.string('magnitude_unit');
  });

  // Watch Zones Table
  await knex.schema.createTable('watch_zones', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.float('radius_km').defaultTo(50.0);
    table.specificType('location', 'GEOGRAPHY(Point, 4326)').notNullable();
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_watch_zones_location ON watch_zones USING GIST(location);');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('watch_zones');
  await knex.schema.dropTableIfExists('event_geometries');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
};