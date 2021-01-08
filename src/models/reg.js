const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    
    username:{
        type:String,
        required:true,
        unique:true
    },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    calories_day:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    }

})

userSchema.pre("save",async function (next){
    
    if(this.isModified("password")){
        // const passwordHash = await bcrypt.hash(password,10);
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
})

const User = new mongoose.model('User',userSchema);

const mealSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    mealtype:{
        type:String,
        required:true
    },
    mealname:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    calories:{
        type:Number,
        required:true
    },
    date:{
        type:String
    }
});

const Meal = new mongoose.model('Meal',mealSchema);

module.exports = {User,Meal};