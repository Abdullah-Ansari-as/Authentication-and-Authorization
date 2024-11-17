const mongoose = require('mongoose')

mongoose.connect("mongodb://127.0.0.1:27017/data-assoc-proj")

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "default.jpg"
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }]
})

module.exports = mongoose.model('user', userSchema);