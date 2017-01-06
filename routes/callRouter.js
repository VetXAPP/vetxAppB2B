var express = require('express'),
callRouter = express.Router(),
Call = require('../models/callSchema.js'),
Clinic = require('../models/clinicSchema.js'),
User = require('../models/userSchema.js'),
Doctor = require('../models/doctorSchema'),
localAuth = require('../config/localAuth.js');

callRouter.post('/initiate',isLoggedIn,function(req,res){

  formData = {
    clinicId:req.user._id,
    userId:req.user._id,
    DoctorId:req.user._id,
    callInitiated:req.body.callInitiated,
    callAccepted:req.body.callAccepted,
    callEnd:req.body.callEnd,
    callWaiting:req.body.callWaiting,
    callIsEnded:req.body.callIsEnded
  };
  new Call(formData).save(function(err,call){
    if(err) res.status(500).json({message:'internal server error'});
    res.status(200).json(call);
  });


});

callRouter.get('/callDetails/:callId',isLoggedIn,function(req,res){
  Call.findOne({_id:req.params.callId}).populate({
    path: 'clinicId',
    select:'clinicName',
    match: {
      active: true
    }
  }).populate({
    path: 'userId',
    select:'name',
    match: {
      active: true
    }
  }).populate({
    path: 'DoctorId',
    select:'firstName lastName',
    match: {
      active: true
    }
  }).exec(function(err,call){
    if(err) res.status(500).json({message:'internal server error'});
    res.status(200).json(call);
  });
});


// callRouter.put('/callEnd/:callId', isLoggedIn,function(req, res) {
//   Call.findOne({
//     _id: req.params.callId,
//     active: true
//   }, function(err, doc) {
//     if (err) res.status(500).json({
//       message: "internal server error"
//     });
//       if (doc) {
//         if (req.body.consultingSummary) doc.summary = req.body.consultingSummary;
//         if (req.body.amt) doc.consultingPrice = req.body.consultingPrice;

//         doc.save(function(err) {
//           if (err) res.status(500).json({
//             message: "internal server error"
//           });
//             res.status(200).json({
//               message: "Call finished success fully!"
//             });
//           });
//       }
//     });
// });


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.send('you are not authenticated');
}
module.exports = callRouter;
