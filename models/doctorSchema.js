var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var doctorSchema = new Schema({
    title: String,
    email: String,
    phoneNumber:String,
    docId:String,
    name: String,
    clinicName: String,
    dateOfJoin: {
        type: Date,
        default: Date.now
    },
    callHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Call"
    }],
    profileImage:String,
    password: String,
    active: {
        type: Boolean,
        default: true
    },
    masterStatus: {
        type: Boolean,
        default: false
    },
    loggedIn:{type:Boolean,default:false},
    loggedOut:{type:Boolean,default:true},
    callStatus: {
        type: String,
        enum : ['available','busy',],
        default: 'available'
    }
});

doctorSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// checking if password is valid
doctorSchema.methods.validPassword = function(password) {
    var doc = this;
    return bcrypt.compareSync(password, doc.password);
};

module.exports = mongoose.model('Doctor', doctorSchema );
