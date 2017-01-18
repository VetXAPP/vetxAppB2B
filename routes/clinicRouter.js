var express = require('express'),
clinicRouter = express.Router(),
Clinic = require('../models/clinicSchema'),
User = require('../models/userSchema'),
Doctor = require('../models/doctorSchema.js'),
Appointment = require('../models/appointmentSchema.js'),
localAuth = require('../config/localAuth.js'),
Cmscontent = require('../models/cmsSchema'),
nodemailer = require('nodemailer'),
smtpTransport = require('nodemailer-smtp-transport'),
multer = require('multer'),
_ = require('lodash'),
path = require('path'),
fs = require('fs'),
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

var braintree = require("braintree"); //for braintree payment gateway
//***    THIS IS FOR SANDBOX BRIAN TREE PAYMENT GATEWAY   ===>>>
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "97tjwg6q5c9gqmj8",
    publicKey: "23qqqyfvdfb2gx4b",
    privateKey: "41c712299f891a5b9e97a807cf5bbbe4"
}); 
 //***    THIS IS FOR SANDBOX BRIAN TREE PAYMENT GATEWAY  <<<===
 
 var Converter = require("csvtojson").Converter;
//credential to veterinarian
var verifyEmail = nodemailer.createTransport((smtpTransport({
    service: 'gmail',
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
        user: "ugendar.doodleblue@gmail.com",
        pass: "ugidoodleblue"
    }
})));

/*
clinicRouter.post('/register', localAuth.authenticate('local-signup'),function(req,res){
  res.json({message:'success',username:req.user.firstName});
});
*/

clinicRouter.post('/register', function(req, res, next) {
    localAuth.authenticate('local-signup', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.json({
                message: info
            });
        }
        else if(user){

          formData = {
            bannerMainText : "Pet care",
            bannerSubText : "an online clinic to take care of your pet",
            boxTitle01 : "video call",
            boxContent01 : "make video call to inquire about your pet health",
            boxTitle02 : "24/7",
            boxContent02 : "24/7 answers to queries of your pets health",
            boxTitle03 : "pet",
            boxContent03 : "take care of pets with our anwers",
            testimosnialsName01 : "tringa",
            testimosnialsTitle01 : "good",
            testimosnialsText01 : "good response from pet care health for queries regarding my pet",
            testimosnialsName02 : "steve rixon",
            testimosnialsText02 : "good response from pet care health for queries regarding my pet",
            testimosnialsTitle02 : "good",
            testimosnialsTitle02 : "good",
            logoImage:"",
            bannerImage:"",
            boxIcon01:"",
            boxIcon02:"",
            boxIcon03:"",
            testimonialsLogo01:"",
            testimonialsLogo02:"",
            clinicName:user.clinicName
        };

        new Cmscontent(formData).save(function(err, cms) {
          if (err) res.status(200).json({
              message: 'internal server error'
          });
              if (cms) {
                  var cmsId = cms._id;
                  Clinic.findOneAndUpdate({
                      clinicName: user.clinicName
                  }, {
                      $push: {
                          cmsContent: cmsId
                      }
                  }, function(err, clinic) {
                      if (err) res.status(500).json({
                          message: 'internal server error'
                      });
                  });

                  console.log(req.body.price);

                  gateway.clientToken.generate({}, function (err, response) {
                    req.session.email = req.body.email;         
                    req.session.password=req.body.password;
                    res.render('payment', {clientToken: response.clientToken, 
                        messages: req.flash('error'),clinicName:user.clinicName,
                        clinicId:user._id,price:req.body.price,email:req.body.email,password:req.body.password});
                });
                  
              }
          });
    }
    //res.json(user);
})(req, res, next);
});

//CLICNIC PAYMENT 



// clinicRouter.get('/payment', isLoggedIn, function(req, res) {


//     res.render("payment");

// });




//CHECK USERNAME EXIST 

clinicRouter.post('/checkUsername', function(req, res) {

    Clinic.findOne({
        clinicName: req.body.username
    }, function(err, user) {

        if(!user){
            res.json({status:true,error:""});
        } else{

            res.json({status:false,error:"Clicnicname already exist *"});
        }
    });
});

//chech email
clinicRouter.post('/checkEmail', function(req, res) {
    Clinic.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if(!user){
                res.json({status:true,error:""});
            } else {
                res.json({status:false,error:"Email id already exist *"});
            }
        });
});





// clinicRouter.post('/login', function(req, res, next) {
//             passport.authenticate('local-login', function(err, user, info) {
//                     if (err) {
//                         mysend(res, 500, 'Ups. Something broke!');
//                     } else if (info) {
//                         mysend(res, 401, 'unauthorized');
//                     } else {
//                         req.login(user, function(err) {
//                                 if (err) {
//                                     mysend(res, 500, 'Ups.');
//                                 } else {
//                                     mysend(res, 200, JSON.stringify(user));
//                                 }
//                             }
//                         }
//                     })(req, res, next);
//             });

//clinicRouter login
clinicRouter.post('/login', function(req, res, next) {

   localAuth.authenticate('local-login', function(err, user, info) {
      if (err) { return next(err); }
      else if (info) { return res.json({"status":401,message:info}); }
      else{
          req.login(user,function(err){
            if(err) res.json({"status":500,message:"internal server error"});
            Clinic.findOneAndUpdate({_id:user.id},{$set:{loggedOut:false,loggedIn:true}},function(err,Clinic){
                if(err) throw err;
            });
            res.json({"status":200,message:user});

        });
      }
  })(req, res, next);

});

// clinicRouter.post('/login', localAuth.authenticate('local-login'),
//     function(req, res,info){
//         if (req.user) { res.send(req.user); }
//         else { res.json({message:info}); }
//     });

//
// clinicRouter.post('/login', function(req, res, next ){
//     localAuth.authenticate('local-login', function(err, user, info) {
//       if (err) { return next(err) }
//           if (!user) { return res.json( { status:202,message:"userid or password wrong"  }) }
//               res.json({ status:201,message:user  });
//       })(req, res, next);
//   });

clinicRouter.get('/logout', isLoggedIn, function(req, res) {

   Clinic.findOneAndUpdate({_id:req.user._id},{$set:{loggedOut:true,loggedIn:false}},function(err,Clinic){
    if(err) throw err;
});
   req.logout();
    //res.render('index');
    res.redirect("/");

});

//API to create doctor

//comment for heroku file upload

clinicRouter.put('/doctor', isLoggedIn,upload.single('profileImage'), function(req, res) {
    var docPassword =req.body.docPassword;
    var doc = new Doctor();
    doc.docId = req.body.docId;
    doc.title = req.body.title;
    doc.email = req.body.email.toLowerCase();
    doc.password = doc.generateHash(docPassword);
    doc.phoneNumber = req.body.phoneNumber;
    doc.name = req.body.name;
    doc.clinicName = req.user.clinicName;
    if(req.file){
        doc.profileImage = req.file.path;
    }else
    {
        doc.profileImage = "uploads/vd.png";
    }
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
    subject: doc.clinicName+' HAS ADDED YOU AS A VETERINARIAN!',
    text: " ",
    template:'vetEmail',
   // html: '<p> you have successfully registered with vetx' + 'email: ' + req.body.email + 'password:'+req.body.password+' ' + 'cliniclink: https://vetx.herokuapp.com/'+clinicName+ '</p>'
   context:{variable1:req.body.email,
     variable2:'https://www.vetxapp.com/'+doc.clinicName+'/doctor',
     variable3:req.body.docPassword,variable4:doc.clinicName,variable5:req.body.name
 }
};





Doctor.count({clinicName:req.user.clinicName},function(err,count){

    console.log(count);
    console.log(req.user.doctorsCount);


    /* Restrict doctor adding based on enterprice plan    */

    if(count<req.user.doctorsCount)
    {
        doc.save(function(err, doc) {
            if (err)
                res.status(500).json({
                    message: 'internal server error'
                });
            if (doc) {

                Clinic.findOneAndUpdate({
                    _id: req.user._id
                }, {
                    $push: {
                        myDoctors: doc._id
                    }
                }, function(err, clinic) {
                    if (err) res.status(500).json({
                        message: "internal server error"
                    });
                });
            }

            transporter.sendMail(mailOptions, function(err){

                console.log(err);
                if(err) throw err;
            });

            res.status(200).json({
                message: 'doctor added successfully'
            });

        });

    }else
    {

     res.status(202).json({
        message: 'Reached your limit!'
    });

 }


});


});

//DOCTOR LOGIN SUCCESS

clinicRouter.get('/dashboard',isLoggedIn,function(req, res, next) {
    Clinic.findOne({
        '_id': req.user._id
    }).populate({
        path: 'myDoctors',
        match: {
            active: true
        },
        select: ' -__v'
    }).populate({
        path: 'users',
        select: '-__v -delete',
        match: {
            delete: false
        }
    }).populate({
        path: 'pet',
        select: '-__v',
        match: {
            active: true
        }
    }).populate({
        path: 'appointment',
        select: '-__v',
        match: {
            active: true
        },
        populate: {
            path: 'pet',
            model: 'Pet',
            populate: {
                path: 'user',
                model: 'User'
            }  
        }
    }).exec(function (err, user){
        Call.find({clinicName:req.user.clinicName}).populate({
            path: 'userId',
            select:'lastName firstName profilePic'
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

            if(err) res.status(500).json({message:'internal server error'});

            var clinicInfo={user:user,"callHistory":call,appointment:user.appointment};
            
            console.log(user.appointment);
            //res.json(user);

            Clinic.findOneAndUpdate({_id:user._id},{$set:{newUser:false}},function(err,Clinic){
                if(err) throw err;
            });
            res.render('dashboard-table',clinicInfo);
        });

    });
});


//api to fetch only doctor details
clinicRouter.get('/activeDoc', isLoggedIn, function(req, res) {
    Clinic.findOne({
        _id: req.user._id
    }).populate({
        path: 'myDoctors',
        match: {
            active: true
        },
        select: '-password -__v'
    }).exec(function(err, details) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            else if (err) {
                if (err.code === 50) {
                    res.status(404).json({
                        message: "veterinarian not found"
                    });
                }
            }
            if (details) {
                var docData = details.myDoctors;
                var activeDoc = [];
                for (var i = 0; i < docData.length; i++) {
                    activeDoc.push(docData[i]);
                }
                res.status(201).json(activeDoc);
            }
        });
});

//api to update doctors
clinicRouter.put('/editVet/:vetId', isLoggedIn,upload.single('profileImage'),function(req, res) {
    Doctor.findOne({
        _id: req.params.vetId,
        active: true
    }, function(err, doc) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (doc) {
                if (req.body.name) doc.name = req.body.name;
                if (req.body.title) doc.title = req.body.title;
                if (req.body.phoneNumber) doc.phoneNumber = req.body.phoneNumber;
                if (req.body.mailId) doc.mailId = req.body.mailId;
                if(req.file) doc.profileImage = req.file.path;
                doc.save(function(err) {
                    if (err) res.status(500).json({
                        message: "internal server error"
                    });
                        res.status(200).json({
                            message: "Doctor details updated successfully"
                        });
                    });
            }
        });
});

//CLINIC PROFILE UPDATE 

clinicRouter.put('/clinicProfileUpdate/:clinicId', isLoggedIn,upload.single('clinicImage'),function(req, res) {

 Clinic.findOne({
    _id: req.params.clinicId,
    active: true
}, function(err, doc) {
    if (err) res.status(500).json({
        message: "internal server error"
    });

       if (doc) {

        var newClinic = new Clinic();
        if (req.body.firstName) doc.firstName = req.body.firstName;
        if (req.body.lastName) doc.lastName = req.body.lastName;
        if (req.body.mobileNumber) doc.mobileNumber = req.body.mobileNumber;
        if (req.body.country) doc.country = req.body.country;
        if (req.body.address) doc.address = req.body.address;
        if (req.body.state) doc.state = req.body.state;
        if (req.body.city) doc.city = req.body.city;
        if (req.body.phoneNumber) doc.phoneNumber = req.body.phoneNumber;
        if (req.body.zipCode) doc.zipCode = req.body.zipCode;
        if (req.body.password) doc.password =newClinic.generateHash(req.body.password);
        
        if(req.file) doc.clinicImage = req.file.path;
        doc.save(function(err) {


            if (err) res.status(500).json({
                message: "internal server error"
            });
                res.status(200).json({
                    message: "Clinic details updated successfully"
                });
            });
    }
});
});






// api to remove doctor
clinicRouter.delete('/remove/:delDoc', isLoggedIn, function(req, res) {
    Doctor.findOneAndUpdate({
        _id: req.params.delDoc
    }, {
        $set: {
            active: false
        }
    }, function(err, doctor) {
        if (err) res.status(500).json({
            message: "Internal server error"
        });
            if (doctor) {
                res.status(200).json({
                    message: "Doctor deleted successfully"
                });
            }
        });
});

//api to upload .csv files and converting into json format
clinicRouter.put('/csvUpload', isLoggedIn, upload.single('csvFile'), function(req, res) {
    var converter = new Converter({});
    converter.fromFile(req.file.path, function(err, result) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (result) {

                Clinic.findOneAndUpdate({
                    _id: req.user.id
                }, {
                    $push: { contactList: { $each: result } } 
                }, function(err, doctor) {
                    if (err) res.status(500).json({
                        message: 'internal server error'
                    });
                        console.log(err);
                        if (doctor) {
                            res.status(200).json({
                                message: 'contact details added successfully'
                            });
                        }
                    });
            }


        });
});

//api to get all users registered with the clinic
clinicRouter.get('/myUser', isLoggedIn, function(req, res) {
    Clinic.findOne({
        _id: req.user._id
    }).populate({
        path: 'users',
        select: '-password -__v -delete',
        match: {
            delete: false
        }
    }).exec(function(err, clinic) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (clinic) {
                var userData = clinic.users;
                var savedData = [];
                for (var i = 0; i < userData.length; i++) {
                    savedData.push(userData[i]);
                    console.log(savedData);
                }
                res.status(200).json(savedData);
            }
        });
});

//api to activate registered users

clinicRouter.put('/activate/:userId', isLoggedIn, function(req, res) {
    User.findOneAndUpdate({
        _id: req.params.userId
    }, {
        $set: {
            active: true
        }
    }, function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
                message: 'user activated'
            });
        });
});



//EDIT USER INFORMATION 
clinicRouter.put('/editUser/:userId', isLoggedIn, function(req, res) {
 User.findOne({
    _id: req.params.userId
}, function(err, doc) {
    if (err) res.status(500).json({
        message: "internal server error"
    });
        if (doc) {
            console.log(req.body.userFirstName);
            if (req.body.userFirstName) doc.firstName = req.body.userFirstName;
            if (req.body.userLastName) doc.lastName = req.body.userLastName;
            if (req.body.userPassword) doc.password = req.body.userPassword;
            doc.save(function(err) {
                if (err) res.status(500).json({
                    message: "internal server error"
                });
                    res.status(200).json({
                        message: "Doctor details updated successfully"
                    });
                });
        }
    });
});

//api to deactivate registered users
clinicRouter.put('/deactivate/:userId', isLoggedIn, function(req, res) {
    User.findOneAndUpdate({
        _id: req.params.userId
    }, {
        $set: {
            active: false
        }
    }, function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
                message: 'user deactivated'
            });
        });
});



//api to delete registered users
clinicRouter.delete('/deleteUser/:userId', isLoggedIn, function(req, res) {
    User.findOneAndUpdate({
        _id: req.params.userId
    }, {
        $set: {
            active: false,
            delete: true
        }
    }, function(err, user) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
                message: 'user deleted'
            });
        });
});


//api to get all pets registerd with the clinicLink
clinicRouter.get('/mypets', isLoggedIn, function(req, res) {
    Clinic.findOne({
        _id: req.user._id
    }).populate({
        path: 'pet',
        select: '-__v',
        match: {
            active: true
        }
    }).exec(function(err, clinic) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (clinic) {
                console.log(doctor);
                var petData = doctor.pet;
                var savedData = [];
                for (var i = 0; i < petData.length; i++) {
                    savedData.push(petData[i]);
                    console.log(savedData);
                }
                res.status(200).json(savedData);
            }
        });
});

//API's to manage contact list

//API to fetch contacts
clinicRouter.get('/contacts', isLoggedIn, function(req, res) {
    Clinic.findOne({
        _id: req.user._id
    }, function(err, clinic) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            if (clinic) {
                var myContact = clinic.contactList;
                var savedData = [];
                for (var i = 0; i < myContact.length; i++) {
                    if (myContact[i].active === true)
                        savedData.push(myContact[i]);
                }
                console.log(savedData);
                res.status(200).json(savedData);
            }
        });
});

//API to update contact details
clinicRouter.put('/editContact/:contactID', isLoggedIn, function(req, res) {

    console.log(req.body.contactFirstName);
    Clinic.findOneAndUpdate({
        "contactList._id": req.params.contactID
    }, {
        $set: {
            'contactList.$.firstName': req.body.contactFirstName,
            'contactList.$.lastName': req.body.contactLastName,
            'contactList.$.email': req.body.contactEmail,
            'contactList.$.phoneNumber': req.body.contactPhoneNumber,
        }
    }, function(err, clinic) {
        if (err) res.status(500).json({
            message: 'internal server error'
        });
            res.status(200).json({
                message: "contact updated"
            });
        });
});

//API to delete contact
clinicRouter.delete('/deleteContact/:contactId', isLoggedIn, function(req, res) {
    Clinic.findOneAndUpdate({
        'contactList._id': req.params.contactId
    }, {
        $set: {
            'contactList.$.active': false
        }
    }, function(err, data) {
        if (err) res.status(500).json({
            message: 'internal server error'
        });
            res.status(200).json({
                message: 'Contact deleted'
            });
        });
});



//API to create cms content
clinicRouter.post('/cmsContent/:clinicName', isLoggedIn, upload.fields([{
    name: 'logoImage',
    maxCount: 1
}, {
    name: 'bannerImage',
    maxCount: 1
}, {
    name: 'boxIcon1',
    maxCount: 1
}, {
    name: 'boxIcon2',
    maxCount: 1
}, {
    name: 'boxIcon3',
    maxCount: 1
}, {
    name: 'tLogo1',
    maxCount: 1
}, {
    name: 'tLogo2',
    maxCount: 1
}]), function(req, res) {

    Cmscontent.findOne({
        clinicName: req.params.clinicName
    }, function(err, clinic) {

        if (err) res.status(500).json({
            message: 'internal server error'
        });
            if (clinic) {
                res.status(422).json({
                    message: "cms content is already created for your clinic, please update"
                });
            } else {
                formData = {
                    bannerMainText: req.body.bannerMainText,
                    bannerSubText: req.body.bannerSubText,
                    boxTitle01: req.body.boxTitle01,
                    boxContent01: req.body.boxContent01,
                    boxTitle02: req.body.boxTitle02,
                    boxContent02: req.body.boxContent02,
                    boxTitle03: req.body.boxTitle03,
                    boxContent03: req.body.boxContent03,
                    testimosnialsName01: req.body.testimosnialsName01,
                    testimosnialsTitle01: req.body.testimosnialsTitle01,
                    testimosnialsText01: req.body.testimosnialsText01,
                    testimosnialsName02: req.body.testimosnialsName02,
                    testimosnialsText02: req.body.testimosnialsText02,
                    testimosnialsTitle02: req.body.testimosnialsTitle02,
                    logoImage: req.files.logoImage[0].path,
                    bannerImage: req.files.bannerImage[0].path,
                    boxIcon01: req.files.boxIcon1[0].path,
                    boxIcon02: req.files.boxIcon2[0].path,
                    boxIcon03: req.files.boxIcon3[0].path,
                    testimonialsLogo01: req.files.tLogo1[0].path,
                    testimonialsLogo02: req.files.tLogo2[0].path,
                    clinicName: req.params.clinicName
                };

                new Cmscontent(formData).save(function(err, cms) {
                    if (err) res.status(200).json({
                        message: 'internal server error'
                    });
                        if (cms) {
                            var cmsId = cms._id;
                            Clinic.findOneAndUpdate({
                                clinicName: req.params.clinicName
                            }, {
                                $push: {
                                    cmsContent: cmsId
                                }
                            }, function(err, clinic) {
                                if (err) res.status(500).json({
                                    message: 'internal server error'
                                });
                                    if (clinic) {
                                        res.status(200).json({
                                            message: 'cms saved successfully'
                                        });
                                    }
                                });
                        }
                    });
            }
        });
});

//API to fetch cms data

clinicRouter.get('/retrieveCMS/:clinicName', isLoggedIn, function(req, res) {
    Clinic.findOne({
        clinicName: req.params.clinicName
    }).populate({
        path: 'cmsContent',
        select: '-__v'
    }).exec(function(err, clinic) {
        if (err) res.status(500).json({
            message: 'internal server error'
        });
            if (clinic) {
                var content = clinic.cmsContent;
                var cmsData = [];
                for (var i = 0; i < content.length; i++) {
                    cmsData.push(content[i]);
                }
                res.status(200).json(cmsData);
            }
        });
});

//API to update cms data
clinicRouter.put('/updateCMS/:clinicName', isLoggedIn, upload.fields([{
    name: 'logoImage',
    maxCount: 1
}, {
    name: 'bannerImage',
    maxCount: 1
}, {
    name: 'boxIcon1',
    maxCount: 1
}, {
    name: 'boxIcon2',
    maxCount: 1
}, {
    name: 'boxIcon3',
    maxCount: 1
}, {
    name: 'tLogo1',
    maxCount: 1
}, {
    name: 'tLogo2',
    maxCount: 1
}]), function(req, res) {
    Cmscontent.findOne({
        clinicName: req.params.clinicName
    }, function(err, cms) {
        if (err) res.status(500).json({
            message: 'internal server error'
        });
            if (cms) {

                if (req.body.bannerMainText) cms.bannerMainText = req.body.bannerMainText;
                if (req.body.bannerSubText) cms.bannerSubText = req.body.bannerSubText;
                if (req.body.boxTitle01) cms.boxTitle01 = req.body.boxTitle01;
                if (req.body.boxTitle02) cms.boxTitle02 = req.body.boxTitle02;
                if (req.body.boxTitle03) cms.boxTitle03 = req.body.boxTitle03;
                if (req.body.boxContent01) cms.boxContent01 = req.body.boxContent01;
                if (req.body.boxContent02) cms.boxContent02 = req.body.boxContent02;
                if (req.body.boxContent03) cms.boxContent03 = req.body.boxContent03;
                if (req.body.testimosnialsName01) cms.testimosnialsName01 = req.body.testimosnialsName01;
                if (req.body.testimosnialsTitle01) cms.testimosnialsTitle01 = req.body.testimosnialsTitle01;
                if (req.body.testimosnialsText01) cms.testimosnialsText01 = req.body.testimosnialsText01;
                if (req.body.testimosnialsName02) cms.testimosnialsName02 = req.body.testimosnialsName02;
                if (req.body.testimosnialsTitle02) cms.testimosnialsTitle02 = req.body.testimosnialsTitle02;
                if (req.body.testimosnialsText02) cms.testimosnialsText02 = req.body.testimosnialsText02;
                if (req.files.logoImage) cms.logoImage = req.files.logoImage[0].path;
                if (req.files.bannerImage) cms.bannerImage = req.files.bannerImage[0].path;
                if (req.files.boxIcon1) cms.boxIcon01 = req.files.boxIcon1[0].path;
                if (req.files.boxIcon2) cms.boxIcon02 = req.files.boxIcon2[0].path;
                if (req.files.boxIcon3) cms.boxIcon03 = req.files.boxIcon3[0].path;
                if (req.files.tLogo1) cms.testimonialsLogo01 = req.files.tLogo1[0].path;
                if (req.files.tLogo2) cms.testimonialsLogo02 = req.files.tLogo2[0].path;
            }
            cms.save(function(err) {
                if (err) res.status(500).json({
                    message: 'internal server error'
                });
                    res.status(200).json({
                        message: 'details updated'
                    });
                });
        });
});





function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect("/");
    //res.send('you are not authenticated');
}
module.exports = clinicRouter;