/**
 * Store notification history independently from the visible inbox.
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('user_event_notification_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .uuid('event_id')
      .notNullable()
      .references('id')
      .inTable('events')
      .onDelete('CASCADE');

    table.timestamp('first_notified_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'event_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_event_notification_history');
};
