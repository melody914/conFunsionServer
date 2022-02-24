// This is the file where we will create the user schema and the model. 
// We'll create a simple user schema which tracks the username and password, and also a flag that is set to indicate whether the user is an administrator or a normal user. 

var mongoose = require('mongoose'); //Import mongoose
var Schema = mongoose.Schema;//Create a mongoose schema
//Require the  passport-local-mongoose
var passportLocalMongoose = require('passport-local-mongoose');
//Import passport

var User = new Schema({

    firstname:{
        type:String,
        default:""
    },
    lastname:{
        type:String,
        default:""
    },
//The facebookId will store the facebookId of the user that has passed in the access token.
    facebookId: String,
/*
    username: {
        type: String,
        required: true,
        unique: true //To avoid the same username in the system
    },
    password:  {
        type: String,
        required: true
    },
*/
    admin:   {
        type: Boolean,
        default: false //when a user is new created, the admin flag will set to false
    }
});

//To plugin the mongoose schema module
User.plugin(passportLocalMongoose);
// the first 'User' is mongoose module, the second User is userSchema
module.exports = mongoose.model('User', User); 