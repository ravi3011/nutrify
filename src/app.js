
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
var localStorage;

const checkLoginUser = (req,res,next) => {
    
    try{
        const userToken = localStorage.getItem('userToken');
        if(req.session.myUserName){
            var decoded = jwt.verify(userToken,'loginToken');
        }else{
            res.redirect("/login");    
        }
    }catch(err){
        res.redirect("/login");
    }
    next();
}


if(typeof localStorage === "undefined" || localStorage === null ){
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

const app = express();
const port = process.env.PORT || 3000; 

// database connection
require("./db/connection");
const {User,Meal} = require("./models/reg");


// path set for pulbic file like css and html
const publicPath = path.join(__dirname,'../public');

// path set for view template engine
const viewsPath = path.join(__dirname,'../templets/views');
const partialPath = path.join(__dirname,'../templets/partials');


app.use(express.json());
app.use(express.urlencoded({extended:false}));

// session seting
app.use(session({
    secret:'eQ6e,&q(\@Lxk@6W',
    resave:false,
    saveUninitialized:true
}));

// setup handlers engine and view location
app.set('view engine','hbs');
app.set('views',viewsPath);

// registering partils file path
hbs.registerPartials(partialPath);

// setup static directory 
app.use(express.static(publicPath));

// home page 

app.get('/',(req,res) =>{
    // var loginUser = localStorage.getItem('loginUser');
    if(req.session.myUserName){
        res.redirect("/profile");
    }else{
        res.render('index');
    }
    
})

app.get('/register',(req,res) =>{
    res.render('register');
})

app.get('/404',(req,res) =>{
    res.render('404',{messg:"404 page not found"});
})


app.post('/register',async (req,res) =>{
        try{
            if(User.find({'username':req.body.username}).count() == 0){
                res.send('User name alredy exists try another');
            }else{
                const userRecord = new User({
                    username:req.body.username,
                    firstname:req.body.firstname,
                    lastname:req.body.lastname,
                    email:req.body.email,
                    mobile:req.body.mobile,
                    calories_day:req.body.calories,
                    password:req.body.password
                });
                const registered = await userRecord.save();
                res.status(201).render('login');
            }
            
        } catch (error){
            res.status(400).send("<h1>User Name alredy present, click <a href='/register'>here</a> to try another again.</h1>");
        }
});


app.get('/login',(req,res) =>{
    res.render('login');
})

app.get('/profile', checkLoginUser, async (req,res) =>{
    try{
        const loginUser = req.session.myUserName;
        const data = await User.findOne({username:loginUser});
        res.render('profile',{username:loginUser,firstName:data.firstname,lastName:data.lastname,calorie:data.calories_day,email:data.email,mob:data.mobile});
    }catch(error)
    {
        res.end(error);
    }
    
})

app.get('/addmeal',checkLoginUser, async (req,res) =>{
    try{
        const loginUser = req.session.myUserName;
        const data = await User.findOne({username:loginUser});
        res.render('addmeal',{firstName:data.firstname,lastName:data.lastname});
    }catch(error){
        res.status(404).send(error)
    }
    
})

// chnaged password for the user get request

app.get('/changedpassword',checkLoginUser, async (req,res) =>{
    try{
        const loginUser = req.session.myUserName
        const data = await User.findOne({username:loginUser});
        res.render('changedpassword',{username:loginUser,firstName:data.firstname,lastName:data.lastname});
    }catch(error){
        res.status(404).send(error)
    }
    
})

// changed password for user post request

app.post('/changedpassword',checkLoginUser, async (req,res) =>{
    try{
        const userName = req.session.myUserName;
        const oldPassword = req.body.oldpassword;
        const newPassword = req.body.newpassword;
        const data = await User.findOne({username:userName});
        const isMatch = await bcrypt.compare(oldPassword,data.password);
        const myPassword = await bcrypt.hash(newPassword,10);
        if(isMatch && data.username === userName){
            const updatedPass = await User.update({username:userName},{$set:{password:myPassword}})
            res.status(201).redirect("profile");
        }
        else{
            res.send("<h1>Not matched passworrd click <a href='/changedpassword'>here</a> to try again.</h1>");
        }

    } catch (error){
        res.status(404).send("Invalid detail");
    }
})


// add meal here 

app.post('/addmeal',checkLoginUser, async (req,res) =>{
    try{
        const userName = req.session.myUserName;
        const mealRecord = new Meal({'username':userName,
                mealtype:req.body.mealtype,
                mealname:req.body.mealname,
                description:req.body.description,
                calories:req.body.calories,
                date:req.body.date
            });
            console.log(req.body.date);
            const registered = await mealRecord.save();
            res.status(201).redirect('addmeal');

    } catch (error){
        res.status(400).send(error);
    };
})

// user dashboard

app.get('/user_dashboard',checkLoginUser, async (req,res) =>{
    try{
        const userName = req.session.myUserName;
        const data = await User.findOne({username:userName});
        const meal = await Meal.find({username:userName});
        if(meal.length === 0){
            res.status(201).render('user_dashboard',{messg:"No meals found",'firstName':data.firstname,'lastName':data.lastname,records:meal});
        }else{
            res.status(201).render('user_dashboard',{messg:"Yoo! All meals are below",
            firstName:data.firstname,
            lastName:data.lastname,
            records:meal});
        }
        

    }catch(error){
        res.status(404).send(error)
    }
    
})


// delete the meal from dashboard

app.get('/user_dashboard/delete/:id',checkLoginUser, async(req,res) =>{
    try{
        const mealId = req.params.id;
        const deleteMeal = await Meal.findByIdAndDelete(mealId);
        // deleteMeal.ec
        res.redirect("/user_dashboard");
      
    }catch(error){
        res.status(404).send(error)
    }
    
})

// Edit the meal 
app.get('/user_dashboard/edit/:id',checkLoginUser, async (req,res) =>{
    try{
        const mealId = req.params.id;
        const mealDelete = await Meal.findById(mealId);
        const loginUser = req.session.myUserName;
        const data = await User.findOne({username:loginUser});
        res.status(201).render('edit_meal',{firstName:data.firstname,lastName:data.lastname,records:mealDelete,id:mealId});
      
    }catch(error){
        res.status(404).send(error)
    }
    
})

app.post('/user_dashboard/edit',checkLoginUser, async (req,res) =>{
    try{
        const mealId = req.body.id;
        const loginUser = req.session.myUserName
        const mealUpdated = await Meal.findByIdAndUpdate(mealId,{                mealtype:req.body.mealtype,
            mealname:req.body.mealname,
            description:req.body.description,
            calories:req.body.calories});
        res.redirect('/user_dashboard');
      
    }catch(error){
        res.status(404).send(error)
    }
    
})


// app.get('/edit_meal',checkLoginUser, async (req,res) =>{
//     try{
//         const loginUser = localStorage.getItem('loginUser');
//         const data = await User.findOne({username:loginUser});
//         res.render('edit_meal',{firstName:data.firstname,lastName:data.lastname});
//     }catch(error){
//         res.status(404).send(error)
//     }
    
// })



// User profile 
app.get('/user_profile',(req,res) =>{
    res.render('user_profile')
})


// login form check
app.post('/login', async (req,res) =>{
    try{
        const username = req.body.username;
        const password = req.body.password;
        const data = await User.findOne({username:username});
        const userId = data._id;
        const isMatch = await bcrypt.compare(password,data.password);
        if(isMatch){
            var token = jwt.sign({userId:userId},'loginToken');
            localStorage.setItem('userToken',token);
            localStorage.setItem('loginUser',username);
            req.session.myUserName=username;
            res.status(201).redirect("profile");
        }
        else{
            res.send("Invalid detail");
        }

    } catch (error){
        res.status(404).send("Invalid detail");
    }
})

app.get("/logout",(req,res) =>{
    req.session.destroy((err) =>{
        if(err){
            res.redirect("/");
        }
    });
    // localStorage.removeItem('userToken');
    // localStorage.removeItem('loginUser');
    res.redirect("/");
});

app.get('*',(req,res) => {
    res.send("<h1>Page not found 404</h1>");
})

app.listen(port,()=>{
    console.log("Server is up on port : " + port);
})

// https://my-nutrify-calories-app.herokuapp.com/