var express = require('express');
const bodyParser = require('body-parser');
//Import the useChema and model from ./models/user
var User = require('../models/user');

//Declare the express router
var router = express.Router();
router.use(bodyParser.json());
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');
// GET users listing
router.get('/', cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,function(req, res, next) {
  User.find({})
  .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type','application/json');
      res.json(users);
  })
  .catch((err)=>{
     res.statusCode = 500;
     res.setHeader('Content-Type','application/json');
     res.json({err:err});
  });
});
/*
//Add sign up routes for user
router.post('/signup', (req, res, next) => {
  User.findOne({username: req.body.username})//the username parse by the body.parser
  .then((user) => {
    if(user != null) {
      var err = new Error('User ' + req.body.username + ' already exists!'); //Dupulicate sign up is not allowed
      err.status = 403;
      next(err);
    }
    else { //let the new user sign up
      return User.create({
        username: req.body.username,
        password: req.body.password});
    }
  })//If the user crete account successfully
  .then((user) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({status: 'Registration Successful!', user: user});
  }, (err) => next(err))
  .catch((err) => next(err));//If the promise doesn't exist successfully
});
*/
// Simplify the sign up property
router.post('/signup', cors.corsWithOptions,(req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      if (req.body.firstname)
         user.firstname = req.body.firstname;
      if (req.body.lastname)
         user.lastname = req.body.lastname;
      user.save((err,user) => {
        if(err){
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      });//On our client side when this json is received, the client can simply extract the success property and then check to see if it is true or not to quickly check if the registration was successful or not. 
    }
  });
});
// Simplify login route with passport module
// If the authentication successfully, then will process to the login prase
router.post('/login', cors.corsWithOptions,passport.authenticate('local'), (req, res) => {
  // To create a token and pass this token back to the user
  // The parameter conatins playload with only the userID
  var token = authenticate.getToken({_id:req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token:token, status: 'You are successfully logged in!'});
});//addin token as the property of the reply message

/*
//Add the login route
router.post('/login', (req, res, next) => {

  if(!req.session.user) {
    var authHeader = req.headers.authorization;
    
    if (!authHeader) {
      var err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401;
      return next(err);
    }
  
    var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    var username = auth[0];
    var password = auth[1];
  // To search in the database to see if the particular user exist
    User.findOne({username: username})
    .then((user) => {
      if (user === null) {
        var err = new Error('User ' + username + ' does not exist!');
        err.status = 403;
        return next(err);
      }
      else if (user.password !== password) {
        var err = new Error('Your password is incorrect!');
        err.status = 403;
        return next(err);
      }
      else if (user.username === username && user.password === password) {
        req.session.user = 'authenticated';
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('You are authenticated!')
      }
    })
    .catch((err) => next(err));
  }
  else { //It happen when the req.session.user is not null
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('You are already authenticated!');
  }
})
*/
// The router to allow login user to logout
router.get('/logout',cors.corsWithOptions, (req, res) => {
  if (req.session) {
    req.session.destroy(); // the information is removed with destory method
    res.clearCookie('session-id'); //clear cookies at the client side
    res.redirect('/'); //Redirect to the home page
  }
  else { 
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

// Login via facebook token

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
// The following req.user object will only be excuted after facebook authentication succeeded
  if (req.user) {
    var token = authenticate.getToken({_id: req.user._id});//You can discard the Facebook access token at this point because the JSON web token is the one that keeps the users authentication active for whatever duration that this JSON web token is active.
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});

module.exports = router;
