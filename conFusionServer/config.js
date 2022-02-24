//This file is to store some configuration information for our server

// I will specify the secret key that I'm going to be using for signing my JSON Web Token
// Specify a Mongo URL here, which will be the URL for my MongoDB server localhost 27017.
module.exports = {
    'secretKey': '12345-67890-09876-54321', 
    'mongoUrl' : 'mongodb://localhost:27017/conFusion',
    'facebook': {
        clientId: '612520293521311',
        clientSecret: '7016b15a1f25ba6cb475d7f401b68e3b'
    }
}

