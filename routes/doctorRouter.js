var express = require('express'),
doctorRouter = express.Router(),
Doctor = require('../models/doctorSchema.js'),
Call = require('../models/callSchema.js'),
localAuth = require('../config/localAuth.js'),
multer = require('multer'),
storage = multer.diskStorage({
  destination: 'uploads',
  filename: function(req, file, cb) {
    cb(null, uuid.v4() + path.extname(file.originalname));
  }
}),
upload = multer({
  storage: storage
});

    //clinicRouter login
    doctorRouter.post('/login', function(req, res, next) {

     localAuth.authenticate('doctor-login', function(err, user, info) {
      if (err) { return next(err); }
      else if (info) { return res.json({"status":401,message:info}); }
      else{
        req.login(user,function(err){
          if(err) res.json({"status":500,message:"internal server error"});
          Doctor.findOneAndUpdate({_id:user.id},{$set:{loggedOut:false,loggedIn:true}},function(err,doctor){
            if(err) throw err;
          });
          res.json({"status":200,message:user});

        });
      }
    })(req, res, next);

  });

//DOCTOR DASHBOARD 

doctorRouter.get('/dashboard',isLoggedIn, function(req, res, next) {

  Call.find({DoctorId:req.user._id}).populate({
    path: 'userId',
    select:'lastName firstName '

  }).populate({
    path: 'userId',
    select:'lastName firstName profilePic'

  }).populate({
    path: 'DoctorId',
    select:'name profileImage'
  }).populate({
    path: 'petId',
    select: '-__v'
  }).exec(function(err,call){

    if(err) res.status(500).json({message:'internal server error'});

    Doctor.find({clinicName: req.user.clinicName}).exec(function(err,docInfo){

      if(err) res.status(500).json({message:'internal server error'});

      var doctorInfo={"doctorInfo":req.user,"callHistory":call,"docInfo":docInfo,"clinicName": req.user.clinicName};
      res.render("doctor_dashboard",doctorInfo);
    });

  });

});

//DOCTOR ROUTER

doctorRouter.put('/callEnd/:callId', isLoggedIn,function(req, res) {
  Call.findOne({
    _id: req.params.callId
  }, function(err, doc) {
    if (err) res.status(500).json({
      message: "internal server error"
    });
      if (doc) {
        if (req.body.consultingSummary) doc.summary = req.body.consultingSummary;
        if (req.body.consultingPrice) doc.amt = req.body.consultingPrice;

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


//FOR VIDEO CALL START 
doctorRouter.get('/doctorVideoCall', isLoggedIn, function(req, res) {
  res.render('video_call_doctor');
});


//DOCTOR PROFILE UPDATE 

doctorRouter.put('/doctorProfileUpdate/:userId', isLoggedIn, upload.single('vetUserImage'),function(req, res) {
  Doctor.findOne({
    _id: req.params.userId
  }, function(err, userInfo) {
    if (err) res.status(500).json({
      message: "internal server error"
    });
      if (userInfo) {
        var doc = new Doctor();
        if (req.body.name) userInfo.name = req.body.name;
        if(req.file) userInfo.profileImage = req.file.path;
        if (req.body.password) userInfo.password = doc.generateHash(req.body.password);
        userInfo.save(function(err) {
          console.log(err);

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


//LOGOUT MODULE


doctorRouter.get('/logout',isLoggedIn,function(req,res){
      //res.send('you have been logged out successfully')
      res.redirect('/'+req.user.clinicName+'/doctor');
      Doctor.findOneAndUpdate({_id:req.user._id},{$set:{loggedOut:true,loggedIn:false}},function(err,doctor){
        if(err) throw err;
      });

       req.logout();  //will get clinic name from ugendar
     });


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect("/");
  //res.redirect('/'+req.user.clinicName+'/doctor');
  //res.send('you are not authenticated');
}
module.exports = doctorRouter;
