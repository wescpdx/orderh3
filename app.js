const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const log = require('./bin/logger');
const h3db = require('./bin/h3db');

const app = express();


// Passport for authentication
const passport = require('passport');
const StrategyGoogle = require('passport-google-oauth20').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

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

passport.use(new StrategyGoogle(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://${process.env.LOCAL_DOMAIN}/auth/google/callback`,
  },
  function(accessToken, refreshToken, profile, done) {
    log.logVerbose('app.passport: Access passport function');
    log.logInfo('app.passport: Trying to authorize Google ID ' + profile.id);
    h3db.fetchUserByAuth(profile.id).then(function(usr) {
      log.logVerbose('app.passport: u = ' + JSON.stringify(usr));
      log.logVerbose('app.passport: u.id = ' + JSON.stringify(usr));
      return done(null, usr);
    });
  }
));

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

// Route handlers
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));

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
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if (req.user) {
    res.locals.username =  req.user.name;
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
