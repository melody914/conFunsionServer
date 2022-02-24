const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer');
const cors = require('./cors');

// To configure the multer with two functions
// The storage function will store the image file in specified destination with original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // the first parmeter is error, the second parmeter is the destination floder where the images will be stored
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});


// The imageFileFilter function will specify which type file will be uploaded or be accepted 
const imageFileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};
// Configure the multer module for use within the application
const upload = multer({ storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

uploadRouter.use(bodyParser.json());

// Only allow post method on the uploadRouter endpoint
uploadRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
})// single means only allow to upload a signle file here
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,upload.single('imageFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file); //pass back this req.file object from the server back to the client
})
.put(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /imageUpload');
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /imageUpload');
});

module.exports = uploadRouter;
