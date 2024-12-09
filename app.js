var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/UserRoute');
var dbConnect = require('./routes/dbConnect');
var adminRouter = require('./routes/adminRoute')

var app = express();

app.use(session({
  secret: 'secret123', // Replace with a secure key
  resave: false,             // Prevents resaving unchanged sessions
  saveUninitialized: true,   // Saves uninitialized sessions
  cookie: {
      maxAge: 1000 * 60 * 60, // Session expiration (1 hour)
      secure: false          // Set to true if using HTTPS
  }
}));



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use(dbConnect);
app.use('/', indexRouter);
app.use('/admin',adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
