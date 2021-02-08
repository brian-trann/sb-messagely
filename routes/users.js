const express = require('express');
const router = new express.Router();

const User = require('../models/user');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async (req, res, next) => {
	try {
		const users = await User.all();
		return res.json({ users });
	} catch (error) {
		return next(error);
	}
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res, next) => {
	try {
		const user = await User.get(req.params.username);

		return res.json({ user });
	} catch (error) {
		return next(error);
	}
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
	try {
		const messages = await User.messagesTo(req.params.username);
		return res.json({ messages });
	} catch (error) {
		return next(error);
	}
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req, res, next) => {
	try {
		const messages = await User.messagesFrom(req.params.username);
		return res.json({ messages });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
