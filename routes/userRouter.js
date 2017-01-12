var express = require('express'),
userRouter = express.Router(),
User = require('../models/userSchema.js'),
Pet = require('../models/petSchema.js'),
Clinic = require('../models/clinicSchema.js'),
Call = require('../models/callSchema.js'),
Doctor = require('../models/doctorSchema.js'),
Appointment = require('../models/appointmentSchema.js'),
nodemailer = require('nodemailer'),
path = require('path'),
multer = require('multer'),
localAuth = require('../config/localAuth.js'),
uuid = require('node-uuid'),
storage = multer.diskStorage({
    destination: 'uploads',
    filename: function(req, file, cb) {
        cb(null, uuid.v4() + path.extname(file.originalname));
    }
}),
upload = multer({
    storage: storage
});

// userRouter.post('/signup/:clinicName', function(req, res, next) {
//  localAuth.authenticate('user-signup', function(err, user, info) {
//   if (err) { return next(err); }
//   else if (info) { return res.json({"status":401,message:info}); }
//   else{
//       req.login(user,function(err){
//         if(err) res.json({"status":500,message:"internal server error"});
//         res.json({"status":200,message:user});
//     });
//   }
// })(req, res, next);

// });

userRouter.post('/signup/:clinicName',upload.single('image'), function(req, res, next) {
 localAuth.authenticate('user-signup', function(err, user, info) {
  if (err) { return next(err); }
  else if (info) { return res.json({"status":401,message:info}); }
  else{
      req.login(user,function(err){
        if(err) res.json({"status":500,message:"internal server error"});
        res.json({"status":200,message:user});
    });
  }
})(req, res, next);
});

    //clinicRouter login
    userRouter.post('/login', function(req, res, next) {

     localAuth.authenticate('user-login', function(err, user, info) {
      if (err) { return next(err); }
      else if (info) { return res.json({"status":401,message:info}); }
      else{
          req.login(user,function(err){
            if(err) res.json({"status":500,message:"internal server error"});
            User.findOneAndUpdate({_id:user.id},{$set:{loggedOut:false,loggedIn:true}},function(err,user){
                if(err) throw err;
            });
            res.json({"status":200,message:user});

        });
      }
  })(req, res, next);

});



    userRouter.get('/dashboard',isLoggedIn,function(req, res, next) {

     User.findOne({
        "_id": req.user._id
    }).populate({
        path: 'pets',
        select: '-__v',
        match: {
            active: true
        }
    }).populate({
        path: 'callHistory',
        select: '-__v'
    }).
    populate({
        path: 'appointment',
        select: '-__v',
        match: {
            active: true
        },
        populate: {
            path: 'pet',
            model: 'Pet'
        }
    }).exec(function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (user) {
                var petData = user.pets;
                var savedPets = [];
                for (var i = 0; i < petData.length; i++) {
                    savedPets.push(petData[i]);
                }
                Call.find({userId:req.user._id}).populate({
                    path: 'userId',
                    select:'lastName firstName'
                    
                }).populate({
                    path: 'userId',
                    select:'lastName firstName'

                }).populate({
                    path: 'DoctorId',
                    select:'name profileImage'
                }).populate({
                    path: 'petId',
                    select: '-__v'
                }).exec(function(err,call){

                    Doctor.find({clinicName: req.user.clinicName}).exec(function(err,docInfo){

                        if(err) res.status(500).json({message:'internal server error'});

                        var clinicInfo={"petInfo":savedPets,"clinicName": req.user.clinicName,"userInfo":req.user,"callHistory":call,docInfo:docInfo,appointment:user.appointment,"image":req.user.profilePic};

                        res.render("vet-user-dashboard",clinicInfo);

                    });


                });


            }
        });

});

//testing api

// userRouter.get('/callDetails/:userId',function(req,res){
//     User.findOne({_id:req.params.userId}).populate({path:'callHistory.userId'}).exec(function(err,user){
//         if(err) throw err;
//         res.josn(user);
//     });
// });

//creating new pet
userRouter.post('/addPet/:clinicName', isLoggedIn, upload.single('image'), function(req, res) {
   if(req.file){
     formData = {
         petName: req.body.petName,
         petType: req.body.petType,
         petBreed: req.body.petBreed,
         petSex: req.body.petSex,
         dateOfBirth: req.body.dateOfBirth,
         petPhoto: req.file.path,
         user:req.user._id
     };
 } else{
     formData = {
         petName: req.body.petName,
         petType: req.body.petType,
         petBreed: req.body.petBreed,
         petSex: req.body.petSex,
         dateOfBirth: req.body.dateOfBirth,
         user:req.user._id
     };
 }
 new Pet(formData).save(function(err, pet) {
    if (err) res.status(500).json({
        message: "internal server error"
    });
        if (pet) {
            var mypet = pet._id;
            User.findOneAndUpdate({
                _id: req.user._id
            }, {
                $push: {
                    pets: pet
                }
            }, function(err, user) {
                if (err) res.status(500).json({
                    message: "internal server error"
                });
                    if (user) {
                        Clinic.findOneAndUpdate({
                            clinicName: req.params.clinicName
                        }, {
                            $push: {
                                pet: pet
                            }
                        }, function(err, pet) {
                            if (err) res.status(500).json({
                                message: "internal server error"
                            });
                                res.status(200).json({
                                    message: "pet saved successfully"
                                });
                            });
                    }
                });
        }
    });
});

//APPOINMENT BOOKING BY USER

userRouter.post('/bookAppointment/:clinicName', isLoggedIn, function(req, res) {

 formData = {
     date: req.body.date,
     time: req.body.timepicker1,
     pet:req.body.appPetId,
     user:req.user._id

 };

 new Appointment(formData).save(function(err, appointment) {
    if (err) res.status(500).json({
        message: "internal server error"
    });
        if (appointment) {
            var myAppointment = appointment._id;
            User.findOneAndUpdate({
                _id: req.user._id
            }, {
                $push: {
                    appointment: appointment
                }
            }, function(err, user) {
                if (err) res.status(500).json({
                    message: "internal server error"
                });
                    if (user) {
                        Clinic.findOneAndUpdate({
                            clinicName: req.params.clinicName
                        }, {
                            $push: {
                                appointment: appointment
                            }
                        }, function(err, appointment) {


                           console.log(appointment._id);

                           if (err) res.status(500).json({
                            message: "internal server error"
                        });

                              Appointment.findOne({
                                '_id': myAppointment
                            }).populate({
                                path: 'pet'
                            }).populate({
                                path: 'user',

                            }).exec(function (err, appointmentInfo){

                               console.log(appointmentInfo);

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
                                to: appointment.email,
                                bcc:"hello@vetxapp.com",
                                subject: "New appointment!",
                                text: " ",
                                template:'appoinment',
                                context:{petName:appointmentInfo.pet.petName,userEmail:appointmentInfo.user.email,time:req.body.timepicker1,
                                    firstName:appointmentInfo.user.firstName,clinicName:req.params.clinicName
                                }
                            };

                            transporter.sendMail(mailOptions, function(err){

                                if(err) throw err;
                            });

                            res.status(200).json({
                                message: "Appointment has been booked successfully"
                            });



                        });





                        });
                    }
                });
        }
    });
});

//EDIT APPOINTMENT 

userRouter.put('/editAppointment/:appointmentId', isLoggedIn, function(req, res) {
    Appointment.findOne({
        _id: req.params.appointmentId
    }, function(err, appointment) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (appointment) {
                if (req.body.date) appointment.date = req.body.date;
                if (req.body.timepicker1) appointment.time = req.body.timepicker1;
                appointment.save(function(err) {
                    if (err) res.status(500).json({
                        message: "internal server error"
                    });
                        res.status(200).json({
                            message: "pet details updated"
                        });
                    });
            }
        });
});

//USER PROFILE UPDATE

userRouter.put('/userProfileUpdate/:userId', isLoggedIn, upload.single('vetUserImage'),function(req, res) {
    User.findOne({
        _id: req.params.userId
    }, function(err, userInfo) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (userInfo) {

                var newUser = new User();
                if (req.body.firstName) userInfo.firstName = req.body.firstName;
                if (req.body.lastName) userInfo.lastName = req.body.lastName;
                if(req.file) userInfo.profilePic = req.file.path;
                if (req.body.password) userInfo.password = newUser.generateHash(req.body.password);
                userInfo.save(function(err) {

                    if (err) res.status(500).json({
                        message: "internal server error"
                    });
                        res.status(200).json({
                            message: "success"
                        });
                    });
            }

        });
});

//REMOVE APPOINTMENT
userRouter.delete('/removeAppointment/:petId', function(req, res) {
    Appointment.findOneAndUpdate({
        _id: req.params.petId
    }, {
        $set: {
            active: false
        }
    }, function(err, pet) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
                message: "Appointment deleted successfully"
            });
        });
});

// API to get my pets
userRouter.get('/myPets', function(req, res) {
    User.findOne({
        _id: req.user._id
    }).populate({
        path: 'pets',
        select: '-__v',
        match: {
            active: true
        }
    }).exec(function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (user) {
                var petData = user.pets;
                var savedPets = [];
                for (var i = 0; i < petData.length; i++) {
                    savedPets.push(petData[i]);
                }
                res.status(200).json(savedPets);
            }
        });
});

//API to delete pet
userRouter.delete('/removePet/:petId', function(req, res) {
    Pet.findOneAndUpdate({
        _id: req.params.petId
    }, {
        $set: {
            active: false
        }
    }, function(err, pet) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
                message: "pet deleted successfully"
            });
        });
});

//API to update pets
userRouter.put('/update/:petId', upload.single('editPetImage'), function(req, res) {
    Pet.findOne({
        _id: req.params.petId
    }, function(err, pet) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (pet) {

                if (req.body.editPetName) pet.petName = req.body.editPetName;
                if (req.body.editPetType) pet.petType = req.body.editPetType;
                if (req.body.editPetBreed) pet.petBreed = req.body.editPetBreed;
                if (req.body.editPetSex) pet.petSex = req.body.editPetSex;
                if (req.body.editDateOfBirth) pet.dateOfBirth = req.body.editDateOfBirth;
                if (req.file) pet.petPhoto = req.file.path;

                pet.save(function(err) {
                    if (err) res.status(500).json({
                        message: "internal server error"
                    });
                        res.status(200).json({
                            message: "pet details updated"
                        });
                    });
            }
        });
});

//API to update user information

userRouter.put('/updateProfile', isLoggedIn,upload.single('profileImg'), function(req, res) {
    User.findOne({
        _id: req.user._id
    }, function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (user) {
                if (req.body.firstName) user.firstName = req.body.firstName;
                if (req.body.lastName) user.lastName = req.body.lastName;
                if (req.body.password) user.password = req.body.password;
                if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
                if (req.body.userName) user.userName = req.body.userName;
                if(req.file) user.profilePic = req.file.path;
                user.save(function(err) {
                    if (err) res.status(500).json({
                        message: 'internal server error'
                    });
                        res.status(200).json({
                            message: 'details updated'
                        });
                    });
            }
        });
});


//SET PAYMENT STATUS


userRouter.put('/paymentStatus/:callId', isLoggedIn,function(req, res) {
  Call.findOne({
    _id: req.params.callId
}, function(err, doc) {
    if (err) res.status(500).json({
      message: "internal server error"
  });
      if (doc) {
         doc.paymentStatus = true;
         doc.save(function(err) {
          if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
              message: "Call finished success fully!"
          });
        });
     }
 });
});

userRouter.get('/logout', isLoggedIn, function(req, res) {
 User.findOneAndUpdate({_id:req.user._id},{$set:{loggedOut:true,loggedIn:false}},function(err,user){
    if(err) throw err;
});
 res.redirect('/'+req.user.clinicName);
 req.logout(); 
});

//FOR VIDEO CALL START 

userRouter.get('/userVideoCall', isLoggedIn, function(req, res) {

    var currentUserInfo={currentUserId:req.user._id};
    res.render('video_call_user',currentUserInfo);
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect("/");
    //res.send('you are not authenticated');
}

module.exports = userRouter;
