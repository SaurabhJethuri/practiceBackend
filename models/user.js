const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },

});
//automatic create username and passport with hasing and salting for us and add this under userSchema
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);
