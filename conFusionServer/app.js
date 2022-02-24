// This is a file to build up the Express application

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// express path logger
var logger = require('morgan');
// Import the express session
var session = require('express-session');
var FileStore = require('session-file-store')(session);
// Import passport module
var passport = require('passport');
// Import the authenticate module
var authenticate = require('./authenticate');
var config = require('./config.js');

//在此处添加router
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter');
var promoRouter = require('./routes/promoRouter');
var leaderRouter = require('./routes/leaderRouter');
var uploadRouter = require('./routes/uploadRouter');
var favoriteRouter = require('./routes/favoriteRouter');

//Require Mongoose
const mongoose = require('mongoose');
//Import dishes from the models floder we just copy
const Dishes = require('./models/dishes');

//Establish the connection of the server
//const url = 'mongodb://localhost:27017/conFusion';
//Use another way to require URL
const url = config.mongoUrl;

const connect = mongoose.connect(url);

connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });

var app = express();

//Set up the middleware to allow all request redirect to the secure port
// all means all request
app.all('*', (req, res, next) => {
  if (req.secure) {
    return next();
  }
  else { //if coming form the insecure port
    res.redirect(307, 'https://' + req.hostname + ':' + app.get('secPort') + req.url);
  } 
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//app.use(cookieParser('12345-67890-09876-54321'));// supply a secret key as the parameter

//Set up the session middleware to make use of our application
/*
app.use(session({
  name: 'session-id',
  secret: '12345-67890-09876-54321',
  saveUninitialized: false,
  resave: false,
  store: new FileStore()
}));
*/

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter); //navigate to root endpoint
app.use('/users', usersRouter); //navigate to users endpoint


// Modify the authentication only on certain routes and not on all routes

/*
//Simplify the authentication code

function auth (req, res, next) {
  console.log(req.user);

  if (!req.user) {
    var err = new Error('You are not authenticated!');
    err.status = 403;
    next(err);
  }
  else {
        next();
  }
}

function auth (req, res, next) {
    console.log(req.session);

  if(!req.session.user) {
      var err = new Error('You are not authenticated!');
      err.status = 403;//forbidden message
      return next(err);
  }
  else {
    if (req.session.user === 'authenticated') {
      next();
    }
    else {
      var err = new Error('You are not authenticated!');
      err.status = 403;
      return next(err);
    }
  }
}

function auth (req, res, next) {
  console.log(req.session); // to see what is contain

  if (!req.session.user) {
      var authHeader = req.headers.authorization;
      if (!authHeader) {
          var err = new Error('You are not authenticated!');
          res.setHeader('WWW-Authenticate', 'Basic');                        
          err.status = 401;
          next(err);
          return;
      }
      var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
      var user = auth[0];
      var pass = auth[1];
      if (user == 'admin' && pass == 'password') {
          req.session.user = 'admin';
          next(); // authorized
      } else {
          var err = new Error('You are not authenticated!');
          res.setHeader('WWW-Authenticate', 'Basic');
          err.status = 401;
          next(err);
      }
  }
  else {
      if (req.session.user === 'admin') {
          console.log('req.session: ',req.session);
          next();
      }
      else {
          var err = new Error('You are not authenticated!');
          err.status = 401;
          next(err);
      }
  }
}

//Modify the authorization middleware to make use of cookies instead of the authorization header
function auth (req, res, next) {
// To see what is actually included in the signed cookie 
  console.log(req.signedCookies);
  //If the signed cookie doesn't conatin the user property on it
  if (!req.signedCookies.user) {
    //we expect the user to authorize by including the authorization header
    var authHeader = req.headers.authorization;
    //If the authorization header is not available,then we will simply reject the user and prompt the user to enter the username and password
    if (!authHeader) {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');              
        err.status = 401;
        next(err);
        return;
    }
    //If the authorization header is included
    //Update as new buffer form the correct some security issue
    var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    var user = auth[0];
    var pass = auth[1];
    
    //If the user is an authorized user
    if (user == 'admin' && pass == 'password') {
        res.cookie('user','admin',{signed: true});//set up the cookie, cookie-parser will ensure that this cookie will be signed and setup
        next(); // recall the next to let the user proceed forward
    } else {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');              
        err.status = 401;
        next(err);
    }
  }// If the signed cookie exists and the user property is defined
  else {
    // If the signed cookie contain the corrct information
      if (req.signedCookies.user === 'admin') {
          next();//Allow the request to pass through
      }//If the cookie is not valid
      else {
          var err = new Error('You are not authenticated!');
          err.status = 401;
          next(err);
      }
  }
}


function auth (req, res, next) {
  console.log(req.headers); //To see what is coming from the cilent side
  var authHeader = req.headers.authorization; //客户添加授权头的位置
  // There is no authentication header in our incoming request then obviously
  // Our client did not include the username and password into the authentication header.
  // We need to challenge our client to supply this information
  if (!authHeader) {
      var err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401; //401 means unauthorized access
      next(err);
      return;
  }
  //if exist, it will extract the authorization header
  //Buffer allow you to split the value
  //It will split that into an array.The first element of the array contains Basic.The second element of the array is the base64 encoded string.
  //Split it again using the colon as the splitting point for this string 
  var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  //auth should be an array containing two items, the username and the password which is extracted from the base64 string.
  var user = auth[0];
  var pass = auth[1];
  //Use encoded usename and password as admin
  if (user == 'admin' && pass == 'password') {
      next(); // from the auth ,the request will pass on the next set of middleware
  } else { //if the username and password did not match the request
      var err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');      
      err.status = 401;
      next(err);
  }
}

// To do authentication right before allow the client to be able to fetch data from our server
app.use(auth);
*/
//to serve static data from the public floder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/dishes',dishRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);
app.use('/imageUpload',uploadRouter);
app.use('/favorites', favoriteRouter);

//全局错误处理器
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
