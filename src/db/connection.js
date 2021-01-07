const mongoose = require('mongoose');

const urlPath = `mongodb+srv://admin:admin@cluster0.1k14s.mongodb.net/practice?retryWrites=true&w=majority`;
// const urlPath = "mongodb://localhost:27017/practice";

mongoose.connect(urlPath,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(()=>{
    console.log("connection successful");
}).catch((e) =>{
    console.log("not connected");
})