require('dotenv').config() //dotenv to keep our keys protected
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// var encrypt = require('mongoose-encryption'); //for encryption
// const md5 = require("md5"); //for hashing
// const bcrypt = require("bcrypt");  //bcrypt
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

// console.log(process.env.API_KEY);  //using Environment variable to keep secret safe
// console.log(md5("milky1111")); //hashing password 

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
/************************************Express-session*************************************************/
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

/************************************passport*************************************************/
app.use(passport.initialize());
app.use(passport.session());


/*******************************DataBase***************************************/
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });
mongoose.set('strictQuery', true);

// encryption

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
/******************using mongoose encryption********************************** */
//encrypt key
// userSchema.plugin(encrypt, { secret: process.env.secret, encryptedFields: ["password"] });
/**************************************end********************************* */

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/************************************get method*************************************************/
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    // if (req.isAuthenticated()) {
    //     res.render("secrets");

    // } else {
    //     res.redirect("/login");
    // }
    User.find({ "secret": { $ne: null } }, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                res.render("secrets", { usersWithSecrets: foundUser });
            }
        }
    }); //to check if secret field is not null
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            // console.log(err);
            return next(err);
        } else {
            res.redirect("/");
        }
    });
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");

    } else {
        res.redirect("/login");
    }
});
/************************************post method*************************************************/
app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            // console.log(err);
            return next(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            // console.log(err);
            return next(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    // console.log(req.user.id);

    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(() => {
                    res.redirect("/secrets");
                })
            }
        }
    });
});



app.listen(3000, () => {
    console.log("server started on port 3000");
});