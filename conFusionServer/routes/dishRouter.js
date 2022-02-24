//This file will contain the implementation of the handling of REST API endpoint for /dishes and /dishes:dishId endpoints. 
//可以看到如何使用Node模块将应用程序重组为多个文件之间的联系 
const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
// Import Mongoose
const mongoose = require('mongoose');
//Require dishes models
const Dishes = require('../models/dishes');

//Declare dishRouter as express router 
const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/') //"/"means the /dishes endpoint 
//preflight the request
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
//cors.cors means the cors middleware is introduced here
.get(cors.cors, (req,res,next) => {
    Dishes.find({}) //Go to dishes and perform the find operation,in the find will handle the request.
    .populate('comments.author')
    .then((dishes) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dishes);//It will put this dishes into the body of the reply message and then send it back to the server.
    }, (err) => next(err)) //Handle error here
    .catch((err) => next(err));
})
//If the post request come in, it will first excute authenticate middleware
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    Dishes.create(req.body) //Create a new dish
    .then((dish) => {
        console.log('Dish Created ', dish); //打出已创建提示
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
//PUT operation is not allowed
.put(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    Dishes.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

dishRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
//POST operation is not supported in the dishID endpoint
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/'+ req.params.dishId);
})
.put(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, {
        $set: req.body
    }, { new: true }) //findbyId method will return the updated dish as a json string in the reply. 
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

//Handling comments
dishRouter.route('/:dishId/comments')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        if (dish != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments); //return the dish comment 
        }
        else { //the dish does not exist
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            req.body.author = req.user._id; //verify whether the request from author
            dish.comments.push(req.body);//push the comment into dish
            dish.save() //save the updated dish
            .then((dish) => {
                Dishes.findById(dish._id)
                      .populate('comments.author')
                      .then((dish) =>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(dish); //If the save return sucessfully , return the updated dish back to the user             
                      })
              
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes/'
        + req.params.dishId + '/comments');
})
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            //we are literally going in and removing each comment,go in and delete each sub-document one by one
            for (var i = (dish.comments.length -1); i >= 0; i--) { 
                dish.comments.id(dish.comments[i]._id).remove();
                //This is how you access a subdocument, and inside here you will specify the id of the subdocuments that you're trying to access. 
                //This whole thing will give you access to the subdocument.
                //Then we call the remove method on the subdocument, and so that subdocument will be removed from the array of subdocuments.
            }
            dish.save()
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish); //once we have removed all the comments for the dish, then we will have to save the dish and then send back                
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

dishRouter.route('/:dishId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        //If both the dish and dish comment exist
        if (dish != null && dish.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments.id(req.params.commentId));//send back the specfic comment
        }
        //If the dish is null
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
        //If the comment is null
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
//Post operation is not supported on the commentID
.post(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/'+ req.params.dishId
        + '/comments/' + req.params.commentId);
})
.put(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        //the author filed is not allowed to modified. the only two field that can be modified is rating and comment
        if (dish != null && dish.comments.id(req.params.commentId) != null 
            && dish.comments.id(req.params.commentId).author.equals(req.user._id)){
            if (req.body.rating) {
                dish.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                dish.comments.id(req.params.commentId).comment = req.body.comment;                
            }
            dish.save() //save the dish
            //Once save successfully, will send back the reply
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);                
            }, (err) => next(err));
        }
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if (dish.comments.id(req.params.commentId) == null) {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else {
            err = new Error('you are not authorized to update this comment!');
            err.status = 403;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null && dish.comments.id(req.params.commentId) != null && dish.comments.id(req.params.commentId).author.equals(req.user._id)) {
            dish.comments.id(req.params.commentId).remove(); //Only delete the specific comment
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id) 
                .populate('comments.author')
                .then((dish) =>{
                   res.statusCode = 200;
                   res.setHeader('Content-Type', 'application/json');
                   res.json(dish);
                })              
            }, (err) => next(err));
        }
        else if (dish.comments.id(req.params.commentId) == null) {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else {
            err = new Error('you are not authorized to delete this comment!');
            err.status = 403;
            return next(err);             
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

// 输出这个js文件
module.exports = dishRouter;