var express = require('express'),
clinicUserRouter = express.Router(),
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


clinicUserRouter.get('/', function(req, res) {

	Clinic.findOne({clinicName:req.clinicId}).populate({
		path: 'cmsContent',
		select: '-__v'
	}).exec(function(err,clinic){
		if(err) res.status(500).json({message:'internal server error'});
		if(clinic){

			var content = clinic.cmsContent;
			var cmsData = [];
			for (var i = 0; i < content.length; i++) {
				cmsData.push(content[i]);
			}
			var clinic_info={"clinic_id":req.clinicId,"content":cmsData,clinicAddress:clinic,
			"clinicName":req.clinicId};
			res.status(200).render("vet_clinic_index",clinic_info);
          //   res.json(clinic_info);
      }
      else
      {

      	res.render("404");
      }



  });



});

// clinicUserRouter.get('/', function(req, res) {

// 	Clinic.findOne({
// 		clinicName: req.clinicId
// 	}, function(err, clinic) {
// 		if (err) res.status(500).json({
// 			message: "internal server error"
// 		});
// 			if (clinic) {
// 				var clinic_info={"clinic_id":req.clinicId};
// 				//res.json(clinic_info);
// 				res.render("vet_clinic_index",clinic_info);	
// 			}
// 			if(!clinic)
// 			{
// 				res.render("404");
// 			}
// 		});
// });

clinicUserRouter.get('/doctor', function(req, res) {

	Clinic.findOne({clinicName:req.clinicId}).populate({
		path: 'cmsContent',
		select: '-__v'
	}).exec(function(err,clinic){
		if(err) res.status(500).json({message:'internal server error'});
		if(clinic){

			var content = clinic.cmsContent;
			var cmsData = [];
			for (var i = 0; i < content.length; i++) {
				cmsData.push(content[i]);
			}
			var clinic_info={"clinic_id":req.clinicId,"content":cmsData,clinicAddress:clinic};
			res.status(200).render("doctor_index",clinic_info);
          //   res.json(clinic_info);
      }
      else
      {

      	res.render("404");
      }

      
  });

	// Clinic.findOne({
	// 	clinicName: req.clinicId
	// }, function(err, clinic) {
	// 	if (err) res.status(500).json({
	// 		message: "internal server error"
	// 	});
	// 		if (clinic) {
	// 			res.render("doctor_index");	
	// 		}
	// 		if(!clinic)
	// 		{
	// 			res.render("404");
	// 		}

	// 	});



});


module.exports = clinicUserRouter;