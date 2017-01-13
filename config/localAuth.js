var clinicStrategy = require('passport-local').Strategy;
var userStrategy = require('passport-local').Strategy;
var doctorStrategy = require('passport-local').Strategy,
Clinic = require('../models/clinicSchema.js'),
Doctor = require('../models/doctorSchema.js'),
User = require('../models/userSchema.js'),
multer = require('multer'),
email = require('mailer'),
uuid = require('node-uuid'),
// storage = multer.diskStorage({
//   destination: './uploads',
//   filename: function(req, file, cb) {
//     cb(null, uuid.v4() + path.extname(file.originalname));
//   }
// }),
// upload = multer({
//   storage: storage
// });
localAuth = require('passport');

//mail configuration
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
// var verifyEmail = nodemailer.createTransport((smtpTransport({
//   service: 'gmail',
//   host: 'smtpout.secureserver.net',
//   port: 587,
//   secure: true,
//   auth: {
//     user: 'ugendar.doodleblue@gmail.com',
//     pass: 'ugidoodleblue'
//   }
// })));

// serialize the user
localAuth.serializeUser(function(user, done) {
  done(null, user.id);
});


//  deserialize the user

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

localAuth.use('local-login', new clinicStrategy({
  usernameField: 'email',
  passwordField: 'password',
passReqToCallback: true // allows us to pass back the entire request to the callback
},
function(req, email, password, done) { // callback with email and password from our form
  Clinic.findOne({
    'email': email,'paymentStatus':true
  }, function(err, clinic) {
    if (err)
      return done(err);
    if (!clinic)
return done(null, false, {info:'You are not registered'}); // req.flash is the way to set flashdata using connect-flash
if (!clinic.validPassword(password))
return done(null, false, {info:'Password mismatch'}); // create the loginMessage and save it to session as flashdata

Clinic.findOneAndUpdate({'email':email},{$set:{loggedIn:true,loggedOut:false}},function(err,Clinic){
  if (err) return done(err);
  return done(null,Clinic);
});

});
}));

localAuth.use('doctor-login', new doctorStrategy({
  usernameField: 'email',
  passwordField: 'password',
passReqToCallback: true // allows us to pass back the entire request to the callback
},
function(req, email, password, done) { // callback with email and password from our form
  Doctor.findOne({
    'email': email,'clinicName':req.body.clinicName
  }, function(err, doc) {
    if (err)
      return done(err);
    if (!doc)
return done(null, false,{info:'you are not registered with vetX'}); // req.flash is the way to set flashdata using connect-flash
if (!doc.validPassword(password))
return done(null, false, {info:'Oops! Wrong password.'}); // create the loginMessage and save it to session as flashdata
Doctor.findOneAndUpdate({'email':email},{$set:{loggedIn:true,loggedOut:false,callStatus:"available"}},function(err,doctor){
  if (err) return done(err);
  return done(null,doctor);
});
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
              return done(null, false, {
                info: 'That email is already taken.'
              });
            } else {
              var clinicName = req.params.clinicName;
              var newUser = new User();
              if (req.file) {
                newUser.profilePic = req.file.path;
                newUser.email = email;
                newUser.password = newUser.generateHash(password);
                newUser.firstName = req.body.firstName;
                newUser.lastName = req.body.lastName;
                newUser.userName = req.body.userName;
                newUser.phoneNumber = req.body.phoneNumber;
                newUser.clinicName = req.body.clinicName;
              } else{

                newUser.email = email;
                newUser.password = newUser.generateHash(password);
                newUser.firstName = req.body.firstName;
                newUser.lastName = req.body.lastName;
                newUser.userName = req.body.userName;
                newUser.phoneNumber = req.body.phoneNumber;
                newUser.clinicName = req.body.clinicName;
              }
              newUser.save(function(err) {
                if (err) throw err;
                var transporter = nodemailer.createTransport('smtps://hello%40vetxapp.com:VetX2016!@smtp.gmail.com');
                var hbs= require('nodemailer-express-handlebars');
                var options = {
                 viewEngine: {
                   extname: '.hbs',
                   layoutsDir: './views/email/',
                 },
                 viewPath: './views/email/',
                 extName: '.hbs'
               };
               transporter.use('compile', hbs(options));
               var mailOptions = {
                 from: 'Vetx <vetx.contact@gmail.com>',
                 to: req.body.email,
                 bcc:"hello@vetxapp.com",
                 subject: 'Welcome to vetX clinic',
                 text: " ",
                 template:'userEmail',
                // html: '<p> you have successfully registered with vetx' + 'email: ' + req.body.email + 'password:'+req.body.password+' ' + 'cliniclink: https://www.vetxapp.com/'+clinicName+ '</p>'

                context:{variable1:email,
                  variable2:'https://www.vetxapp.com/'+clinicName,variable3:password,variable4:req.body.firstName,clinicName:clinicName}
                };
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
                    transporter.sendMail(mailOptions, function(err){
                      if(err) throw err;
                    });
                    return done(null, newUser);
                  });
                });
              });
            }
          });
        });
      }));




localAuth.use('local-signup', new clinicStrategy({
  usernameField: 'username',
  passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },
      function(req, username, password, done) {
        process.nextTick(function() {
          Clinic.findOne({
            username: username
          }, function(err, clinic) {
            if (err) return done(err);
            if (clinic) {
              return done(null, false, {
                info: 'clinicname is already registered with vetx'
              });
            } else if (!clinic) {
              Clinic.findOne({
                email: req.body.email
              }, function(err, clinic) {
                if (err) throw authenticateerr;
                if (clinic) {
                  return done(null, false, {
                    info: 'email is already registered with vetx'
                  });
                } else {
                            //            var clinicLink = email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
                            clinicName = username.replace(/ +/g, "");
                            var newClinic = new Clinic();
                            newClinic.username = username;
                            newClinic.email = req.body.email.toLowerCase();
                            newClinic.password = newClinic.generateHash(password);
                            newClinic.firstName = req.body.firstName;
                            newClinic.lastName = req.body.lastName;
                            newClinic.clinicName = clinicName;
                            newClinic.mobileNumber = req.body.mobileNumber;
                            newClinic.country = req.body.country;
                            newClinic.address = req.body.address;
                            newClinic.state = req.body.state;
                            newClinic.city = req.body.city;
                            newClinic.username = req.body.username;
                            newClinic.phoneNumber = req.body.phoneNumber;
                            newClinic.zipCode = req.body.zipCode;
                            newClinic.planInfo = req.body.plan_info;
                            //email
                            
                            var transporter = nodemailer.createTransport('smtps://hello%40vetxapp.com:VetX2016!@smtp.gmail.com');
                            var hbs= require('nodemailer-express-handlebars');
                            var options = {
                              viewEngine: {
                                extname: '.hbs',
                                layoutsDir: './views/email/',
                              },
                              viewPath: './views/email/',
                              extName: '.hbs'
                            };
                            transporter.use('compile', hbs(options));
                            var mailOptions = {
                             from: 'Vetx <vetx.contact@gmail.com>',
                             to: req.body.email,
                             bcc:"hello@vetxapp.com",
                             subject: 'Thank you for joining VetX!',
                             text: " ",
                             template:'welcomeEmail',
                              // html: '<p> you have successfully registered with vetx' + 'email: ' + req.body.email + 'password:'+req.body.password+' ' + 'cliniclink: https://www.vetxapp.com/'+clinicName+ '</p>'
                              context:{variable1:req.body.email,
                                variable2:'https://www.vetxapp.com/'+clinicName,
                                variable3:password,variable4:clinicName

                              }
                            };
                            newClinic.save(function(err) {
                              if (err) console.log(err);

                              transporter.sendMail(mailOptions, function(error, info){

                              });

                              return done(null, newClinic);
                            });

                          }
                        });
            }

          });
        });
      }));


// localAuth.use('local-signup', new clinicStrategy({
//   usernameField: 'username',
//   passwordField: 'password',
//         passReqToCallback: true // allows us to pass back the entire request to the callback
//       },
//       function(req, username, password, done) {
//         process.nextTick(function() {
//           Clinic.findOne({
//             username: username
//           }, function(err, clinic) {
//             if (err) return done(err);
//             if (clinic) {
//               return done(null, false, {
//                 info: 'clinicname is already registered with vetx'
//               });
//             } else if (!clinic) {
//               Clinic.findOne({
//                 email: req.body.email
//               }, function(err, clinic) {
//                 if (err) throw err;
//                 if (clinic) {
//                   return done(null, false, {
//                     info: 'email is already registered with vetx'
//                   });
//                 } else {
//                             //            var clinicLink = email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
//                             clinicName = username.replace(/ +/g, "");
//                             var newClinic = new Clinic();
//                             newClinic.username = username;
//                             newClinic.email = req.body.email;
//                             newClinic.password = newClinic.generateHash(password);
//                             newClinic.firstName = req.body.firstName;
//                             newClinic.lastName = req.body.lastName;
//                             newClinic.clinicName = clinicName;
//                             newClinic.mobileNumber = req.body.mobileNumber;
//                             newClinic.country = req.body.country;
//                             newClinic.address = req.body.address;
//                             newClinic.state = req.body.state;
//                             newClinic.city = req.body.city;
//                             newClinic.username = req.body.username;
//                             newClinic.phoneNumber = req.body.phoneNumber;
//                             newClinic.zipCode = req.body.zipCode;
//                             newClinic.planInfo = req.body.plan_info;
//                             //email
//                             newClinic.save(function(err) {
//                               if (err) console.log(err);
//                             //email
//                             email.send({
//                               host: "smtp.gmail.com",
//                               port: "465",
//                               ssl: true,
//                                         //  domain : "i-visionblog.com",
//                                         to: req.body.email,
//                                         from: 'ugendar <ugendar.doodleblue@gmail.com>',
//                                         subject: "Vetx B2B - Registeration",
//                                         text: "Mail by Mailer library",
//                                         html: "<span> Hello World Mail sent from  mailer library",
//                                         //authentication: "login", // auth login is supported; anything else $
//                                         username: 'ugendar.doodleblue@gmail.com',
//                                         password: 'ugidoodleblue'
//                                       },
//                                       function(err, result) {
//                                         if (err) {
//                                           //self.now.error(err);
//                                           console.log(err);
//                                           //res.send("error occured");
//                                         } else {
//                                           console.log('hurray! Email Sent');
//                                           return done(null, newClinic);
//                                         }
//                                       });
//                           });
//                           }
//                         });
//             }

//           });
//         });
//       }));


// localAuth.use('local-signup', new clinicStrategy({
//   usernameField: 'username',
//   passwordField: 'password',
//     passReqToCallback: true // allows us to pass back the entire request to the callback
//   },
//   function(req, username,password, done) {
//     process.nextTick(function() {
//       Clinic.findOne({
//         username: username
//       }, function(err, clinic) {
//         if (err) return done(err);
//         if(clinic){
//           return done(null, false, {info:'clinicname is already registered with vetx'});
//         } else if(!clinic){
//           Clinic.findOne({email:req.body.email},function(err,clinic){
//             if(err) throw err;
//             if(clinic){
//               return done(null, false, {info:'email is already registered with vetx'});
//             } else {
//            //            var clinicLink = email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
//            clinicName = username.replace(/ +/g, "");
//            var newClinic = new Clinic();
//            newClinic.username = username;
//            newClinic.email = req.body.email;
//            newClinic.password = newClinic.generateHash(password);
//            newClinic.firstName = req.body.firstName;
//            newClinic.lastName = req.body.lastName;
//            newClinic.clinicName = clinicName;
//            newClinic.mobileNumber = req.body.mobileNumber;
//            newClinic.country = req.body.country;
//            newClinic.address = req.body.address;
//            newClinic.state = req.body.state;
//            newClinic.city = req.body.city;
//            newClinic.username = req.body.username;
//            newClinic.phoneNumber = req.body.phoneNumber;
//            newClinic.zipCode = req.body.zipCode;
//            newClinic.planInfo = req.body.plan_info;
//                        // newClinic.subscription.enterprise = req.body.enterprise;
//                        // newClinic.subscription.price = req.body.price;
//                        // newClinic.subscription.quantity = req.body.quantity;
//                //        newClinic.clinicLink = clinicLink;
//                var mainOptions = {
//                  from: 'ugendar <ugendar.doodleblue@gmail.com>',
//                  to: req.body.email,
//                  subject: 'welcome to vetX clinic',
//                  text: " ",
//                  html: '<p> you have successfully registered with vetx' + 'email: ' + req.body.email + ' ' + 'cliniclink: http://localhost:3330/'+clinicName+ '</p>'
//                };
//                newClinic.save(function(err) {
//                  if (err) console.log(err);
//                  verifyEmail.sendMail(mainOptions, function(err){
//                    //if(err) throw err;
//                  });
//                  return done(null, newClinic);
//                });
//              }
//            });
//         }

//       });
//     });
//   }));


localAuth.use('user-login', new userStrategy({
  usernameField: 'email',
  passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
      User.findOne({
        'email': email,'clinicName':req.body.clinicName
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