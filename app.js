const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const uploads = require('./config/multerconfig')

const cookieParser = require('cookie-parser');
const path = require('path');
const user = require('./models/user');


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.render('index')
})

app.post('/signup', async (req, res) => {
    let { name, email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("User already exist!");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                name,
                email,
                password: hash
            })

            let token = jwt.sign({ email: email, userid: createdUser._id }, "secretkey");
            res.cookie("token", token);
            res.send("registered")

        })
    })

});

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("something went wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "secretkey");
            res.cookie("token", token);
            res.redirect("/profile")
        } else {
            res.redirect('/login')
        }
    })

})

app.get('/profile', isLoggedin, async (req, res) => {

    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    // console.log(user)
    res.render('profile', { user })
})

app.post('/post', isLoggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    //  console.log(user)

    let post = await postModel.create({
        user: user._id,
        content: req.body.content
    })

    // console.log(post);

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")


})

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login')
})

app.get('/like/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    // console.log(post) 

    if (post.likes.length === 0) {
        post.likes.push(req.user.userid)
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect("/profile");
})

app.get('/edit/:id', isLoggedin, async (req, res) => {
    let data = await postModel.findOne({ _id: req.params.id }).populate("user");
    // console.log(data)
    res.render('edit', {data});
})

app.post('/update/:id', isLoggedin, async (req, res) => {
     let post = await postModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content});
     res.redirect('/profile')
})

app.get('/profileupload', isLoggedin, (req, res) => {
    res.render('profileupload')
})

app.post('/upload', isLoggedin, uploads.single('profileImage'), async (req, res) => {
    // console.log(req.file)
    let user = await userModel.findOne({ email: req.user.email });
    // console.log(user)
    user.profilepic = req.file.filename;
    user.save();
    res.redirect('/profile')
})




// protected route (middleware)
function isLoggedin(req, res, next) {
    if (req.cookies.token === "") return res.redirect('/login');
    else {
        let data = jwt.verify(req.cookies.token, "secretkey");
        // console.log(data)
        req.user = data;
        next();
    }
}

app.listen(3000)