//This is where to create the schema and models for leaders document

//Import Mongoose and schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create the schema
const leaderSchema = new Schema ({
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
    designation: {
        type: String,
        required:true
    },
    abbr: {
        type: String,
        required: true
     },
    featured: {
        type: Boolean,
        default:false  // If the document is missing , then the default value will be added into the document here    
    },
},{
    timestamps: true //save the file create and update time automatically
});

//Using the leader schema
var Leaders = mongoose.model('Leader', leaderSchema);
//Export this module we defined
module.exports = Leaders;
