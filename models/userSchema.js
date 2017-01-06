var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: {type:String,unique:true},
    password: String,
    pets: [{
        type: Schema.Types.ObjectId,
        ref: 'Pet'
    }],
    callHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Call"
    }],
    appointment: [{
        type: Schema.Types.ObjectId,
        ref: "appointment"
    }],
    phoneNumber: String,
    userName: String,
    profilePic: String,
    clinicName:String,
    active: {
        type: Boolean,
        default: true
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic'
    },
    delete:{type:Boolean,default:false},
    loggedIn:{type:Boolean,default:false},
    loggedOut:{type:Boolean,default:true},
    callStatus: {
        type: String,
        enum : ['available','busy']
    }
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// checking if password is valid
userSchema.methods.validPassword = function(password) {
    var user = this;
    return bcrypt.compareSync(password, user.password);
};

module.exports = mongoose.model('User', userSchema);
