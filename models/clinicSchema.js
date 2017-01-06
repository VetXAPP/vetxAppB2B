var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var clinicSchema = new Schema({
    firstName: String,
    lastName: String,
    clinicName: {
        type: String,
        unique: true
    },
    mobileNumber: String,
    email: {
        type: String,
        unique: true
    },
    username:String,
    password: String,
    country: String,
    address: String,
    state: String,
    city: String,
    phoneNumber: String,
    zipCode: String,
    myDoctors: [{
        type: Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    pet: [{
        type: Schema.Types.ObjectId,
        ref: "Pet"
    }],
    callHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Call"
    }],
    users: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    appointment: [{
        type: Schema.Types.ObjectId,
        ref: "appointment"
    }],
    subscription: {
        enterprise: String,
        price: Number,
        quantity: Number
    },
    subscribed: {
        type: Boolean
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    logo: {
        type: String
    },
    planInfo: {
        type: Schema.Types.ObjectId,
        ref: "Enterprise"
    },
    contactList: [{
        firstName: String,
        lastName: String,
        email: String,
        phoneNumber: String,
        active: {
            type: Boolean,
            default: true
        }
    }],
    homePagePics: [String],
    cmsContent: [{
        type: Schema.Types.ObjectId,
        ref: 'Cmscontent'
    }], 
    loggedIn:{type:Boolean},
    loggedOut:{type:Boolean},
    newUser:{type:Boolean,default:true},
    callStatus: {
        type: String,
        enum : ['available','busy']
    },
    paymentStatus:{type:Boolean,default:false},
    clinicImage:{type:String}
});

clinicSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// checking if password is valid
clinicSchema.methods.validPassword = function(password) {
    var clinic = this;
    return bcrypt.compareSync(password, clinic.password);
};
module.exports = mongoose.model('Clinic', clinicSchema);