var clinicStrategy = require('passport-local').Strategy;
var userStrategy = require('passport-local').Strategy;
var doctorStrategy = require('passport-local').Strategy,
Clinic = require('../models/clinicSchema.js'),
Doctor = require('../models/doctorSchema.js'),
User = require('../models/userSchema.js'),
localAuth = require('passport');

//mail configuration
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var verifyEmail = nodemailer.createTransport((smtpTransport({
    service: 'gmail',
    host: 'smtpout.secureserver.net',
    port: 587,
    secure: true,
    auth: {
        user: 'ugendar.doodleblue@gmail.com',
        pass: 'ugidoodleblue'
    }
})));

// serialize the user
localAuth.serializeUser(function(user, done) {
    done(null, user.id);
});
//  deserialize the user
localAuth.deserializeUser(function(id, done) {
    Clinic.findById(id, function(err, user) {
        if (err) done(err);
        if (user) {
            done(null, user);
        } else {
            Doctor.findById(id, function(err, user) {
                if (err) done(err);
                if (user) {
                    done(null, user);
                } else {
                    User.findById(id, function(err, user) {
                        if (err) done(err);
                        done(null, user);
                    });
                }
            });
        }
    });
});


localAuth.use('local-signup', new clinicStrategy({
    usernameField: 'email',
    passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        process.nextTick(function() {
            Clinic.findOne({
                'email': email
            }, function(err, clinic) {
                if (err) return done(err);
                if (clinic) {
                    return done(null, false,  {info:'That email is already taken'});
                } else {
                    var clinicLink = email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
                    var newClinic = new Clinic();
                    newClinic.email = email;
                    newClinic.password = newClinic.generateHash(password);
                    newClinic.firstName = req.body.firstName;
                    newClinic.lastName = req.body.lastName;
                    newClinic.clinicName = req.body.clinicName;
                    newClinic.mobileNumber = req.body.mobileNumber;
                    newClinic.country = req.body.country;
                    newClinic.address = req.body.address;
                    newClinic.state = req.body.state;
                    newClinic.city = req.body.city;
                    newClinic.phoneNumber = req.body.phoneNumber;
                    newClinic.zipCode = req.body.zipCode;
                    newClinic.subscription.enterprise = req.body.enterprise;
                    newClinic.subscription.price = req.body.price;
                    newClinic.subscription.quantity = req.body.quantity;
                    newClinic.clinicLink = clinicLink;
                    newClinic.save(function(err) {
                        if (err) throw err;
                        return done(null, newClinic);
                    });
                }
            });
        });
    }));


localAuth.use('local-login', new clinicStrategy({
    usernameField: 'email',
    passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        Clinic.findOne({
            'email': email
        }, function(err, clinic) {
            if (err)
                return done(err);
            if (!clinic)
                return done(null, false, {info:'You are not registered'}); // req.flash is the way to set flashdata using connect-flash
            if (!clinic.validPassword(password))
                return done(null, false, {info:'Password mismatch'}); // create the loginMessage and save it to session as flashdata
            return done(null, clinic);
        });
    }));

localAuth.use('doctor-login', new doctorStrategy({
    usernameField: 'email',
    passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        Doctor.findOne({
            'email': email
        }, function(err, doc) {
            if (err)
                return done(err);
            if (!doc)
                return done(null, false,{info:'you are not registered with vetX'}); // req.flash is the way to set flashdata using connect-flash
            if (!doc.validPassword(password))
                return done(null, false, {info:'Oops! Wrong password.'}); // create the loginMessage and save it to session as flashdata
            return done(null, doc);
        });
    }));

localAuth.use('user-signup', new userStrategy({
    usernameField: 'email',
    passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        process.nextTick(function() {
            User.findOne({
                'email': email
            }, function(err, user) {
                if (err) return done(err);
                if (user) {
                    return done(null, false, {info:'That email is already taken.'});
                } else {
                    var newUser = new User();
                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);
                    newUser.firstName = req.body.firstName;
                    newUser.lastName = req.body.lastName;
                    newUser.userName = req.body.userName;
                    newUser.phoneNumber = req.body.phoneNumber;
                    //      newUser.profilePic = req.file.path;
                    newUser.save(function(err) {
                        if (err) throw err;
                        Clinic.findOneAndUpdate({
                            clinicName: req.params.clinicName
                        }, {
                            $push: {
                                users: newUser._id
                            }
                        }, function(err, clinic) {
                            if (err) throw err;
                            return done(null, newUser);
                        });
                    });
                }
            });
        });
    }));


localAuth.use('user-login', new userStrategy({
    usernameField: 'email',
    passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        User.findOne({
            'email': email
        }, function(err, user) {
            if (err)
                return done(err);
            if (!user)
                return done(null, false,{info:'you are not registered with vetX lab'}); // req.flash is the way to set flashdata using connect-flash
            if (!user.validPassword(password))
                return done(null, false,{info:'Oops wrong password'}); // create the loginMessage and save it to session as flashdata
            return done(null, user);
        });
    }));
module.exports = localAuth;
