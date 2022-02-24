// This file is setting up different passport authentication strategies

//Import passport
var passport = require('passport');
//The passport local module exports a strategy that we can use for our application
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
//Provide us with a JSON Web Token based strategy for configuring our passport module
var JwtStrategy = require('passport-jwt').Strategy;
//To extract JWT
var ExtractJwt = require('passport-jwt').ExtractJwt;
//Import the json web token module
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
//Import facebook token strategy
var FacebookTokenStrategy = require('passport-facebook-token');


// Import the config file
var config = require('./config.js');
//Take the user information
exports.local = passport.use(new LocalStrategy(User.authenticate()));
//User information will be serialized and deserialized realized by using passport 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// The function helps us to create the JSON Web Token 
// The first parameter will allow the payload comes which is called user
// The second parameter is the secret or private key get from config.secret key
// Supply additional options expiresin.The expiresIn will tell you how long the jsonwebtoken will be valid so in this case I say 3,600 meaning 3,600 seconds or about an hour

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey,
        {expiresIn: 3600});
};
//Declare a variable called opts
var opts = {};
//This option specifies how the jsonwebtoken should be extracted from the incoming request message.
//This extract JWT supports various methods for extracting information from the header. 
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
//This is the second option which helps me to supply the secret key which I'm going to be using within my strategy for the sign-in.
opts.secretOrKey = config.secretKey;
// Specifying the JWT based strategy, 
exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);// to see what is inside the JWT playload
        //Search for the user
        //The first parmeter is ID field, the second parmeter is call back function
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false); //calling done fuction above,false means the user doesn't exist
            }
            else if (user) {
                return done(null, user); //user means the user we just got from MongoDB
            }
            else {
                return done(null, false);//could not find the user
            }
        });
    }));
// Export verifyUser function to vertify an incoming user
// Set the session option to false beacuse now we are using token-based authentication
exports.verifyUser = passport.authenticate('jwt', {session: false});

// To verify whether the user is admin
exports.verifyAdmin = function(req, res, next) {
    User.findOne({_id: req.user._id})
    .then((user) => {
        console.log("User: ", req.user);
        if (user.admin) {
            next();
        }
        else {
            err = new Error('You are not authorized to perform this operation!');
            err.status = 403;
            return next(err);
        } 
    }, (err) => next(err))
    .catch((err) => next(err))
}

//Specify new FacebookToken Strategy
exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({facebookId: profile.id}, (err, user) => {
        if (err) {
            return done(err, false);
        }
        if (!err && user !== null) {
            return done(null, user); //null means no error, and return user value
        }
        else { //if the user does not exit, it will creat a new user
            user = new User({ username: profile.displayName });
            user.facebookId = profile.id;
            user.firstname = profile.name.givenName;
            user.lastname = profile.name.familyName; // all above returned from the user's Facebook profile
            user.save((err, user) => {
                if (err)
                    return done(err, false);
                else
                    return done(null, user);
            }) // It will return error if user created fail, otherwise it will return created user
        }
    });
}
));