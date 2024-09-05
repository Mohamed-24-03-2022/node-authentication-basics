var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

const { Pool } = require('pg');

const session = require('express-session');
const passport = require('passport');
const crypto = require('crypto');

const pgSession = require('connect-pg-simple')(session);



var app = express();


const pool = new Pool({
  host: 'localhost',
  user: 'mohamed',
  database: 'top_authentication',
  password: '123456',
  port: 5432,
});

const sessionStore = new pgSession({
  // Insert connect-pg-simple options here
  pool: pool,
  createTableIfMissing: true
});

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true, //! careful here
  store: sessionStore,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // equal to 1 day
}));
app.use(passport.session());



app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());





app.get('/', (req, res, next) => {
  if (req.session.viewCount)
    req.session.viewCount++;
  else
    req.session.viewCount = 1;

  res.send(`<h1> You have visited the site ${req.session.viewCount} times. </h1>`);
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
})
