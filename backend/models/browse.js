const mongoose = require("mongoose");
const user = require("./user.js")
const ServiceSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:String,
    price:Number,
    image:{
        url:String,
       filename:String,
    },
    location:String,
    category:{
        type:String,
        required:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }



});

const Service = mongoose.model("Service",ServiceSchema);
module.exports = Service;