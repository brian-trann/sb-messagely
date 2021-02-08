/** User class for message.ly */

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const ExpressError = require('../expressError');

/** User of the site. */

class User {
	/** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

	static async register({ username, password, first_name, last_name, phone }) {
		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

		const res = await db.query(
			`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1,$2,$3,$4,$5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
			[ username, hashedPassword, first_name, last_name, phone ]
		);

		return res.rows[0];
	}

	/** Authenticate: is this username/password valid? Returns boolean. */

	static async authenticate(username, password) {
		const res = await db.query(`SELECT password FROM users WHERE username = $1`, [ username ]);
		const user = res.rows[0];

		return user && (await bcrypt.compare(password, user.password));
	}

	/** Update last_login_at for user */

	static async updateLoginTimestamp(username) {
		const res = await db.query(
			`UPDATE users SET last_login_at = current_timestamp WHERE username = $1
      RETURNING username`,
			[ username ]
		);
		// If I try to update a user that doesnt exist, nothing will happen
		const user = res.rows[0];

		if (!user) {
			throw new ExpressError(`There is no user: ${username}`, 404);
		}
	}

	/** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
	static async all() {
		const res = await db.query(
			`SELECT username,first_name,last_name,phone 
      FROM users`
		);
		return res.rows;
	}

	/** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
	static async get(username) {
		const res = await db.query(
			`SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at 
      FROM users WHERE username = $1`,
			[ username ]
		);
		const user = res.rows[0];

		if (!user) {
			throw new ExpressError(`There is no user: ${username}`, 404);
		}

		return user;
	}

	/** messagesFrom - Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
	static async messagesFrom(username) {
		const res = await db.query(
			`SELECT m.id,
              m.to_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
        JOIN users AS u
        ON m.to_username = u.username
        WHERE m.from_username = $1`,
			[ username ]
		);

		const messagesFrom = res.rows.map((message) => {
			return {
				id      : message.id,
				body    : message.body,
				sent_at : message.sent_at,
				read_at : message.read_at,
				to_user : {
					username   : message.to_username,
					first_name : message.first_name,
					last_name  : message.last_name,
					phone      : message.phone
				}
			};
		});
		return messagesFrom;
	}

	/** messagesTo - Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

	static async messagesTo(username) {
		const res = await db.query(
			`SELECT m.id,
              m.from_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
        JOIN users AS u
        ON m.from_username = u.username
        WHERE to_username = $1`,
			[ username ]
		);
		const messagesTo = res.rows.map((message) => {
			return {
				id        : message.id,
				body      : message.body,
				sent_at   : message.sent_at,
				read_at   : message.read_at,
				from_user : {
					username   : message.from_username,
					first_name : message.first_name,
					last_name  : message.last_name,
					phone      : message.phone
				}
			};
		});
		return messagesTo;
	}
}

module.exports = User;
