//This is where to create the schema and models for promotions document

//Import Mongoose and schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Import Mongoose Currency
require('mongoose-currency').loadType(mongoose);
//Add a new type currency
const Currency = mongoose.Types.Currency;

//Create the schema
const promotionSchema = new Schema ({
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
        default:false  // If the document is missing, then the default value will be added into the document here    
    },
},{
    timestamps: true //save the file create and update time automatically
});

//Using the promotion schema
var Promotions = mongoose.model('Promotion', promotionSchema);
//Export this module we defined
module.exports = Promotions;

