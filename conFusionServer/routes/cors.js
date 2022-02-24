const express = require('express');
const cors = require('cors');
const app = express();

// The whitelist contains all the origins that this server is willing to accept
const whitelist = ['http://localhost:3000', 'https://localhost:3443'];
// The fuciton is to check whether the incoming request belongs to the whitelisted origins
var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    console.log(req.header('Origin'));
// If the incoming request header contains an origin feed, then we are going to check this whitelist.
// The index of operation will return the index greater than or equal to zero if this is present in this array. It'll return -1 if this is not present in this array. 
    if(whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true }; //origin:true means incoming request in the whitelist
    }
    else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};
// Reply back with access control allowOrigin
exports.cors = cors();
// To apply A cors with specific options to a particular route
exports.corsWithOptions = cors(corsOptionsDelegate);