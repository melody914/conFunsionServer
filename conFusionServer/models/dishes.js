//This is where to create the schema and models for dishes document

//Import Mongoose and schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Import Mongoose Currency
require('mongoose-currency').loadType(mongoose);
//Add a new type currency
const Currency = mongoose.Types.Currency;

//Add another schema, which is going to store comment of the dish
const commentSchema = new Schema({
    rating:  {
        type: Number, //如果你的数据类型是Number，你可以定义它的取值范围
        min: 1,
        max: 5,
        required: true
    },
    comment:  {
        type: String,
        required: true
    },
    author:  {
        //the author field now instead of storing a string, will have a reference to the user document.
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
}, {
    timestamps: true
});

//Create the schema
const dishSchema = new Schema ({
//Define various values
    name: {
       type: String,
       required: true,//Every document will have name as a required field
       unique: true //No two document should have the same name field 
    },
    description: {
       type: String,
       required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: '' //Add a default value as empty string
    },
    price: {
        type: Currency, //Set the price type as currency which has declaired above
        required: true,
        min: 0 //set minnimum value as 0
    },
    featured: {
        type: Boolean,
        default:false  // If my document is missing that, then the default value will be added into the document here    
    },
    comments:[commentSchema] //添加commentSchema数组，这是dish文件中的子文件
},{
    timestamps: true //自动保存每个文件的创建与更新时间戳
});

//Using the dish schema
var Dishes = mongoose.model('Dish', dishSchema);
//Export this module we defined
module.exports = Dishes;

