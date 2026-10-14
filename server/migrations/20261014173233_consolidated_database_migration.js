/**
 * Consolidated Database Migration for EONET Disaster Tracker
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Enable PostGIS & UUID extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis;');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  // Users Table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name').nullable();
    table.jsonb('push_subscription').nullable(); // Stores browser web-push keys
    table.boolean('all_notifications_muted').defaultTo(false); // Global toggle
    table.timestamps(true, true);
  });

  // Refresh Tokens Table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Watch Zones Table
  await knex.schema.createTable('watch_zones', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.float('radius_km').defaultTo(50.0);
    table.specificType('location', 'GEOGRAPHY(Point, 4326)').notNullable();
    table.boolean('is_muted').defaultTo(false); // Mute alerts specifically for this zone
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_watch_zones_location ON watch_zones USING GIST(location);');

  // Categories Table
  await knex.schema.createTable('categories', (table) => {
    table.string('id').primary(); // NASA category string ID
    table.string('title').notNullable();
  });

  // Events Table
  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('nasa_id').unique().notNullable();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.string('link').nullable();
    table.timestamp('closed_at').nullable(); // NULL = Active, Timestamp = Closed
    table.specificType('latest_location', 'GEOGRAPHY(Point, 4326)').notNullable();
    table.string('country_code', 2).nullable(); // ISO-2 country code (e.g. 'US', 'MX')
    table.string('country_name').nullable();
    table.timestamp('last_synced_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_events_latest_location ON events USING GIST(latest_location);');
  await knex.raw('CREATE INDEX idx_events_closed_at ON events(closed_at);');

  // Event - Categories Junction Table
  await knex.schema.createTable('event_categories', (table) => {
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.string('category_id').references('id').inTable('categories').onDelete('CASCADE');
    table.primary(['event_id', 'category_id']);
  });

  // Event Geometries
  await knex.schema.createTable('event_geometries', (table) => {
    table.increments('id').primary();
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.timestamp('recorded_at').notNullable();
    table.specificType('location', 'GEOGRAPHY(Point, 4326)').notNullable();
    table.float('magnitude_value').nullable();
    table.string('magnitude_unit').nullable();
  });

  await knex.raw('CREATE INDEX idx_event_geometries_location ON event_geometries USING GIST(location);');

  // In-App Notification Inbox Table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('watch_zone_id').nullable().references('id').inTable('watch_zones').onDelete('SET NULL');
    table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_notifications_user_id_unread ON notifications(user_id) WHERE is_read = FALSE;');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('event_geometries');
  await knex.schema.dropTableIfExists('event_categories');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('watch_zones');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
};