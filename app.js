var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

const { Pool } = require('pg');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  user: 'mohamed',
  database: 'top_authentication',
  password: '123456',
  port: 5432,
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


/*__________________________________________________________________________________________________________*/
app.use(
  session({
    secret: 'cats',
    resave: false,
    saveUninitialized: false,
    // cookie: { maxAge: 24 * 60 * 60 * 1000 }, // equal to 1 day
    // currently using memory to store sessions id
  })
);
app.use(passport.session());

/* LocalStrategy function setup */
// it will be used when we call passport.authenticate()
// it acts a bit like a middleware and will be called for us when we ask passport to do the authentication later
// passport.use(strategy);
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect password' });
      }

      return done(null, user);

    } catch (err) {
      done(err);
    }
  })
);

/* Sessions and Serialization functions setup */
// To make sure our user is logged in, and to allow him to stay logged in as he moves around our app
// passport internally calls a function from express-session that uses some data to create a cookie called connect.sid which is stored in the user’s browser.
// These next two functions define what bit of information passport is looking for when it creates and then decodes the cookie.
// passport.serializeUser takes a callback which contains the information we wish to store in the session data
// passport.deserializeUser is called when retrieving a session
// We ain't calling these two functions; they’re used in the background by passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = rows[0];

    done(null, user);
  } catch (error) {
    done(error);
  }
});
/*__________________________________________________________________________________________________________*/

// to have access to the current user in all our views without passing it to each controller
// Make it accessible to all views template
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.get('/', (req, res, next) => {
  res.render('index', {});
});
app.get('/sign-up', (req, res, next) => {
  res.render('sign-up-form');
});
app.post('/sign-up', async (req, res, next) => {
  bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
    if (err) {
      return next(err);
    }

    try {
      await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
        req.body.username,
        hashedPassword,
      ]);
      res.redirect('/');
    } catch (error) {
      return next(error);
    }
  });
});
app.post(
  '/log-in',

  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
  })
);
app.get('/log-out', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    res.redirect('/');
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  console.log(err);

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

app.listen(3000, () => {
  console.log('listening on port', 3000);
});
