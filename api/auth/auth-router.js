const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../../data/dbConfig.js');
const jwt = require('jsonwebtoken');

// Middlewares here

function findById(id) {
  return db('users').where('id', id).first();
}

function findBy(filter) {
  return db('users').where(filter);
}

function validateInputsExist(req, res, next) {
  if (!req.body.username || !req.body.username.trim() || !req.body.password || !req.body.password.trim()) {
    next({ status: 401, message: 'username and password required' });
  } else {
    next();
  }
}

async function uniqueUsername(req, res, next) {
  try {
    const users = await findBy({ username: req.body.username });
    if (!users.length) {
      next();
    } else {
      next({ status: 422, message: 'username taken' });
    }
  } catch (err) {
    next(err);
  }
}

async function checkUsernameExists(req, res, next) {
  try {
    const users = await findBy({ username: req.body.username });
    if (users.length) {
      req.user = users[0];
      next();
    } else {
      next({ status: 401, message: "invalid credentials" });
    }
  } catch (err) {
    next(err);
  }
}

async function addUser({ username, password }) {
  let created_id;
  await db.transaction(async trx => {
    const [id] = await trx('users').insert({ username, password });
    created_id = id;
  });
  return findById(created_id);
}

// Router functions here

router.post('/register', validateInputsExist, uniqueUsername, (req, res, next) => {
  /*
   IMPLEMENT
   You are welcome to build additional middlewares to help with the endpoint's functionality.
   DO NOT EXCEED 2^8 ROUNDS OF HASHING!

   1- In order to register a new account the client must provide `username` and `password`:
     {
       "username": "Captain Marvel", // must not exist already in the `users` table
       "password": "foobar"          // needs to be hashed before it's saved
     }

   2- On SUCCESSFUL registration,
     the response body should have `id`, `username` and `password`:
     {
       "id": 1,
       "username": "Captain Marvel",
       "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
     }

   3- On FAILED registration due to `username` or `password` missing from the request body,
     the response body should include a string exactly as follows: "username and password required".

   4- On FAILED registration due to the `username` being taken,
     the response body should include a string exactly as follows: "username taken".
 */
  const { username, password } = req.body;
  const hash = bcrypt.hashSync(password, 8);

  addUser({ username, password: hash })
    .then(newUser => {
      res.status(201).json(newUser);
    })
    .catch(next);
});

router.post('/login', validateInputsExist, checkUsernameExists, (req, res, next) => {
  /*
  IMPLEMENT
  You are welcome to build additional middlewares to help with the endpoint's functionality.

  1- In order to log into an existing account the client must provide `username` and `password`:
    {
      "username": "Captain Marvel",
      "password": "foobar"
    }

  2- On SUCCESSFUL login,
    the response body should have `message` and `token`:
    {
      "message": "welcome, Captain Marvel",
      "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
    }

  3- On FAILED login due to `username` or `password` missing from the request body,
    the response body should include a string exactly as follows: "username and password required".

  4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
    the response body should include a string exactly as follows: "invalid credentials".
*/

  function buildToken(user) {
    const payload = {
      subject: user.user_id,
      role_name: user.role_name,
      username: user.username,
    };
    const options = {
      expiresIn: '1d',
    };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  const { password } = req.body;
  if (bcrypt.compareSync(password, req.user.password)) {
    const token = buildToken(req.user);
    req.session.user = req.user;
    res.json({ message: `Welcome ${req.user.username}`, token });
  } else {
    next({ status: 401, message: 'invalid credentials' });
  }
});

module.exports = router;
