const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const log = require('./bin/logger');
const auth = require('./bin/auth');

const app = express();


// Passport for authentication
const passport = require('passport');
const StrategyGoogle = require('passport-google-oauth20').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

// Get rid of trailing slashes
app.use((req, res, next) => {
  const test = /\?[^]*\//.test(req.url);
  if (req.url.substr(-1) === '/' && req.url.length > 1 && !test)
    res.redirect(301, req.url.slice(0, -1));
  else
    next();
});

// Session storage
app.use(session({
  store: new (require('connect-pg-simple')(session))(),
  secret: process.env.SESSION_COOKIE_SECRET,
  conString: process.env.DATABASE_URL,
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  saveUninitialized: true
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new StrategyGoogle(auth.passportStategyConfig, auth.passportStrategyHandler));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Vars to make available to all views
app.use((req, res, next) => {
  res.locals.loggedIn = !!req.user; 
  res.locals.dataEntry = !!auth.isDataEntry(req);
  next();
})

// Route handlers
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/about', require('./routes/about'));
app.use('/profile', require('./routes/profile'));
app.use('/reports', require('./routes/reports'));
app.use('/hasher', require('./routes/hasher'));
app.use('/event', require('./routes/event'));
app.use('/api/hasher', require('./routes/api/hasher'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.ENVIRONMENT === "development" ? err : {};
  if (req.user) {
    res.locals.username =  req.user.name;
  }

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
