var express = require('express'),
clinicRouter = express.Router(),
Clinic = require('../models/clinicSchema'),
User = require('../models/userSchema'),
Doctor = require('../models/doctorSchema.js'),
localAuth = require('../config/localAuth.js'),
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

        res.redirect("/vetx");

    //res.json(user);

})(req, res, next);
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
    req.logout();
    res.render('index');
});

//API to create doctor

//comment for heroku file upload

//API to create doctor
clinicRouter.put('/doctor', isLoggedIn, upload.single('profileImage'), function(req, res) {
    var docPassword = Math.random().toString(36).slice(-8);
    var doc = new Doctor();
    if(req.file){
      doc.docId = req.body.docId;
      doc.title = req.body.title;
      doc.email = req.body.email;
      doc.password = doc.generateHash(docPassword);
      doc.phoneNumber = req.body.phoneNumber;
      doc.name = req.body.name;
      doc.profileImage = req.file.path;
  } else if(req.body){
      doc.docId = req.body.docId;
      doc.title = req.body.title;
      doc.email = req.body.email;
      doc.password = doc.generateHash(docPassword);
      doc.phoneNumber = req.body.phoneNumber;
      doc.name = req.body.name;
  }
  var transporter = nodemailer.createTransport('smtps://vetx.contact%40gmail.com:password1234!@smtp.gmail.com');
  var mailOptions = {
   from: 'Vetx <vetx.contact@gmail.com>',
   to: req.body.email,
   subject: 'welcome to vetX clinic',
   text: " ",
   html: '<p> you have successfully registered with vetx' + 'email: ' + req.body.email +  'password:'+req.body.password+' '+ 'cliniclink: https://vetx.herokuapp.com/'+req.user.clinicName+ '/doctor</p>'
};
transporter.sendMail(mailOptions, function(err, info) {
 if (err) throw err;
 if (info) {
     doc.save(function(err, doc) {
         if (err)
             res.status(500).json({
                 message: 'internal server error'
             });
         if (doc) {
             console.log(doc);
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
         res.status(200).json({
             message: 'doctor added successfully'
         });

     });
 }
});
});



//DOCTOR LOGIN SUCCESS


clinicRouter.get('/dashboard', function(req, res, next) {
    // Clinic.findOne({_id: req.user._id}).populate('').populate('').populate('')
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
    }).exec(function (err, user){

        //res.json({user:user});

        res.render('dashboard-table',{user:user});


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

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.send('you are not authenticated');
}
module.exports = clinicRouter;
