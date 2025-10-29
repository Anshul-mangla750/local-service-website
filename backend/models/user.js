const mongoose = require("mongoose");
const passport =  require("passport") ;
const LocalStrategy = require("passport-local");
const  passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
   
    email: {
        type: String,
        required: true,
       
    },
    password: {
        type: String,
        
    },
    
    role: {
        type: String,
        enum: ["customer", "provider"],
        default: "customer"
    },
   
   
});
userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model("User", userSchema);
