 var express = require('express'),
 app = express(),
 mongoose = require('mongoose'),
 bodyParser = require('body-parser'),
 config = require('./config'),
 flash = require('flash'),
 session = require('express-session'),
 path = require('path'),
 fs = require('fs'),
 port = process.env.PORT || 3330;
 mongoose.Promise = global.Promise;
 mongoose.connect(config.database); //connection with database
 var session = require('express-session');

 app.use(bodyParser.urlencoded({
 	extended: true
 }));

 var Doctor = require('./models/doctorSchema.js'),
 User = require('./models/userSchema.js');
 Call = require('./models/callSchema.js'),
 Clinic = require('./models/clinicSchema.js'),
 Doctor = require('./models/doctorSchema');

 //TWILIO VIDEO CALL START  ==>>>>
 var AccessToken = require('twilio').AccessToken;
 var VideoGrant = AccessToken.VideoGrant;
 var randomUsername = require('./randos');
 var http = require('http').Server(app);
 var io = require('socket.io')(http);
//***    THIS IS FOR SANDBOX BRIAN TREE PAYMENT GATEWAY   ===>>>
var braintree = require("braintree");
var gateway = braintree.connect({
	environment: braintree.Environment.Sandbox,
	merchantId: "97tjwg6q5c9gqmj8",
	publicKey: "23qqqyfvdfb2gx4b",
	privateKey: "41c712299f891a5b9e97a807cf5bbbe4"
}); 
 //***    THIS IS FOR SANDBOX BRIAN TREE PAYMENT GATEWAY  <<<===
 /*
Generate an Access Token for a chat application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/
app.get('/token', function(request, response) {
	var identity = randomUsername();

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    // var token = new AccessToken(
    //     process.env.TWILIO_ACCOUNT_SID,
    //     process.env.TWILIO_API_KEY,
    //     process.env.TWILIO_API_SECRET
    //     );

    var token = new AccessToken(
            "AC7cb5701d56ef255068a870059545ca10", //TWILIO_ACCOUNT_SID,
            "SKd5e648148179d0dcd1e479a4ed4edff5", //TWILIO_API_KEY
            "u7Z0jc7wNNaGjnXI9r8PQxG69D5XJXdI" //TWILIO_API_SECRET
            );
    // Assign the generated identity to the token
    token.identity = identity;

    //grant the access token Twilio Video capabilities
    var grant = new VideoGrant();
    // grant.configurationProfileSid = process.env.TWILIO_CONFIGURATION_SID;
     grant.configurationProfileSid = "VS69e7737eed5ce6c0223bff0bedfe159f"; //TWILIO_CONFIGURATION_SID
     token.addGrant(grant);

    // Serialize the token to a JWT string and include it in a JSON response
    response.send({
    	identity: identity,
    	token: token.toJwt()
    });
});

 //TWILIO VIDEO CALL END   <<<<=====

 app.use(bodyParser.json());
 app.use("/public", express.static(__dirname + "/public"));
 app.use("/enterPrise/public", express.static(__dirname + "/public"));
 app.use("/clinic/public", express.static(__dirname + "/public"));
 app.use("/clinic", express.static(__dirname + "/public/clinic"));
 app.use("/user/clinic", express.static(__dirname + "/public/clinic"));
 app.use("/user/clinic", express.static(__dirname + "/public/clinic"));
 app.use("/doctor", express.static(__dirname + "/public/doctor"));
 app.set('view engine', '.ejs'); // register the template engine
 var localAuth = require('./config/localAuth.js');
 app.use(session({
 	secret: 'vetXauthentication',
 	resave: false,
 	saveUninitialized: false
 })); // session secret

 app.use(localAuth.initialize());
 app.use(localAuth.session());

 app.use(flash());
 var enterpriseRouter = require('./routes/enterpriseRouter.js');
 var clinicRouter = require('./routes/clinicRouter.js');
 var doctorRouter = require('./routes/doctorRouter.js');
 var userRouter = require('./routes/userRouter.js');
 var clinicUserRouter = require('./routes/clinicUserRouter.js');
 var callRouter = require('./routes/callRouter.js');
 var braintree = require("braintree"); //for braintree payment gateway

//***    THIS IS FOR SANDBOX BRIAN TREE PAYMENT GATEWAY   ===>>>

var gateway = braintree.connect({
	environment: braintree.Environment.Sandbox,
	merchantId: "97tjwg6q5c9gqmj8",
	publicKey: "23qqqyfvdfb2gx4b",
	privateKey: "41c712299f891a5b9e97a807cf5bbbe4"
}); 

 //***    THIS IS FOR SANDBOX BRIAN TREE PAYMENT GATEWAY  <<<===

 app.use('/clinic', clinicRouter);
 app.use('/doctor',doctorRouter);
 app.use('/user',userRouter);
 app.use('/enterprise',enterpriseRouter);
 app.use('/call',callRouter);

 // app.get('/vetx',function(req,res){
 // 	res.render("index",{ message: req.flash('loginMessage') });
 // });
 
 app.get('/',function(req,res){
 	res.render("index",{ message: req.flash('loginMessage') });
 });

 app.get('/success',function(req,res){
 	res.render("success");
 });
 app.get('/contactus', function(req, res) {
 	res.render('contactpage');
 });
 app.get('/faq', function(req, res) {
 	res.render('faq');
 });

//**************   SOCKET CONNECTION END FOR VIDEO CALL  *************/////

var server = require('http').createServer(app),
io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket){

//CALL CONNECT REQUEST FROM USER
socket.on('connect_call', function(info, callback)
{

	Doctor.find({
		clinicName: info.clinicId,callStatus:'available',masterStatus:false,loggedIn:true
	}).exec(function(err, doctor) {
		if (err)
		{
			console.log(err);
		} 
		if (doctor) {
			if(doctor.length!=0)
			{
				var callActionInfo={userInfo:info,doctorInfo:doctor};

				socket.volatile.emit("quickCallcut_"+info.callUserId,{status:201,message:"success",callActionInfo});
				socket.broadcast.emit("call_action_"+doctor[0]._id,{status:201,message:"success",callActionInfo});
			}
			else
			{
				Doctor.find({
					callStatus:'available',masterStatus:true
				}).exec(function(err, masterDoctor) {
					if (err)
					{
						console.log(err);
					} 
					if (masterDoctor) {
						if(masterDoctor.length!=0)
						{

							var callActionInfo={userInfo:info,doctorInfo:masterDoctor};

							socket.broadcast.emit("call_action_"+masterDoctor[0]._id,{status:201,message:"success",callActionInfo});

							socket.broadcast.emit("quickCallcut_"+info.callUserId,{status:201,message:"success",callActionInfo});

						}
						else
						{
							console.log("All doctor's are busy");
						}
					}
				});
			}
		}

	});

});

//CALL ACCEPT FROM DOCTOR

socket.on('accept_status', function(info, callback)
{

	Doctor.findOneAndUpdate({_id:info.doctorId},{$set:{callStatus:"busy"}},function(err,doctor){
		if(err) throw err;
	});

	socket.broadcast.emit("call_accept_status_"+info.user_id,{status:201,message:"success",info:info});

});

//CALL END  STATUS FOR DOCTOR 

socket.on('callEndStatus', function(info, callback)
{

	Doctor.findOneAndUpdate({_id:info.doctorId},{$set:{callStatus:"available"}},function(err,doctor){
		if(err) throw err;
	});
	socket.broadcast.emit("callEndStatusInfo_"+info.doctorId,{status:201,message:"success",info:info});

});

//CALL END STATUS FOR USER

socket.on('userCallEndStatus', function(info, callback)
{

	Doctor.findOneAndUpdate({_id:info.doctorId},{$set:{callStatus:"available"}},function(err,doctor){
		if(err) throw err;
	});
	socket.broadcast.emit("userCallEndStatusInfo_"+info.user_id,{status:201,message:"success",info:info});

});

//TESTING FOR EBINSON

// socket.on('ebinson', function(info, callback)
// {

// 	socket.broadcast.emit("arun",{status:200,message:"success",info:"super"});

// });

//QUCIK CALL CUT DIOCTOR 

socket.on('quickCallcutDoctor', function(info, callback)
{
	console.log(info);
	socket.broadcast.emit("quickCallcutDoctorInfo_"+info.quickCallcutDoctor,{status:200,message:"success",info:"super"});
});

//CALL HISTORY INFORMATION 

socket.on('callHistory', function(info, callback)
{
	formData = {
		clinicName:info.info.clinicId,
		userId:info.info.user_id,
		DoctorId:info.info.doctorId,
		petId:info.info.petId,
		// callInitiated:req.body.callInitiated,
		// callAccepted:req.body.callAccepted,
		// callEnd:req.body.callEnd,
		// callWaiting:req.body.callWaiting,
		// callIsEnded:req.body.callIsEnded
	};
	new Call(formData).save(function(err,call){

		if(err) res.status(500).json({message:'internal server error'});

		Call.findOne({_id:call._id}).populate({
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

			var clinicInfo={"callHistory":call};

			socket.broadcast.emit("startCallHistory",{status:201,message:"success",info:clinicInfo});

		});

//** UPDATE CALL ID  FOR CLINIC 

Clinic.findOneAndUpdate({
	clinicName: info.info.clinicId
}, {
	$push: {
		callHistory: call._id
	}
}, function(err, pet) {
	if (err) res.status(500).json({
		message: "internal server error"
	});
		
});

//** UPDATE CALL ID  FOR USER 

User.findOneAndUpdate({
	clinicName: info.info.clinicId
}, {
	$push: {
		callHistory: call._id
	}
}, function(err, pet) {
	if (err) res.status(500).json({
		message: "internal server error"
	});
		
});

//**  UPDATE CALL ID  FOR DOCTOR 

Doctor.findOneAndUpdate({
	clinicName: info.info.clinicId
}, {
	$push: {
		callHistory: call._id
	}
}, function(err, pet) {
	if (err) res.status(500).json({
		message: "internal server error"
	});
		
});
});

});


});

//**************   SOCKET CONNECTION END FOR VIDEO CALL                   *************/////


//CLINIC PAYMENT MODULES 

app.post('/checkouts', function (req, res) {
	var transactionErrors;
  var amount = req.body.amount; // In production you should not take amounts directly from clients
  var nonce = req.body.payment_method_nonce;

  gateway.transaction.sale({
  	amount: amount,
  	paymentMethodNonce: nonce,
  	options: {
  		submitForSettlement: true
  	}
  }, function (err, result) {
  	if (result.success || result.transaction) {

  		Clinic.findOneAndUpdate({
  			_id: req.body.clinicId
  		}, {
  			$set: {
  				paymentStatus:true
  			}
  		}, function(err, clinicInfo) {


  			if (err) res.status(500).json({
  				message: "internal server error"
  			});

  				var info={"email":req.session.email,"password":req.session.password};
  				res.render('success',info);

  			});

  	} else {

  		res.render('failure');

  	}
  });
});

//USER PAYMENT MODULE 


app.get('/userPayment', function (req, res){

	gateway.clientToken.generate({}, function (err, response) {
		var userPaymentInfo={callId:req.query.q,amount:req.query.r,clientToken: response.clientToken};
		res.render("user-payment",userPaymentInfo);
	});
	 
});

app.post('/userCheckouts', function (req, res) {
	var transactionErrors;
  var amount = req.body.amount; // In production you should not take amounts directly from clients
  var nonce = req.body.payment_method_nonce;

  gateway.transaction.sale({
  	amount: amount,
  	paymentMethodNonce: nonce,
  	options: {
  		submitForSettlement: true
  	}
  }, function (err, result) {

  	console.log(result);
  	if (result.success || result.transaction) {

  		
  		Call.findOne({
  			_id: req.body.callId
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
  							res.redirect('user/dashboard?a=1&r='+amount);

  						});
  				}
  			});
  	} else {

  		res.redirect('user/dashboard?a=0&r='+amount);

  	}
  });
});


var myLogger = function (req, res, next) {
	//console.log(req.params.vetLab)
	req.clinicId = req.params.vetLab;
	app.use("/"+req.params.vetLab+"/clinic", express.static(__dirname + "/public/clinic"));
	next()
}
//IMAGE VIEW 
app.get('/user/uploads/:file', function (req, res){
	        file = req.params.file;
	        var img = fs.readFileSync("uploads/" + file);
	        res.writeHead(200, {'Content-Type': 'image/jpg' });
	        res.end(img, 'binary');
	 
});
app.get('/clinic/uploads/:file', function (req, res){
	        file = req.params.file;
	        var img = fs.readFileSync("uploads/" + file);
	        res.writeHead(200, {'Content-Type': 'image/jpg' });
	        res.end(img, 'binary');
	 
});

app.get('/doctor/uploads/:file', function (req, res){
	        file = req.params.file;
	        var img = fs.readFileSync("uploads/" + file);
	        res.writeHead(200, {'Content-Type': 'image/jpg' });
	        res.end(img, 'binary');
});

// app.use('/:any',function(req,res){
// 	res.render("404");
// });

app.get('/uploads/:file', function (req, res){
	file = req.params.file;
	var img = fs.readFileSync("uploads/" + file);
	res.writeHead(200, {'Content-Type': 'image/jpg' });
	res.end(img, 'binary');
});
app.get('/:doctor/uploads/:file', function (req, res){
	file = req.params.file;
	var img = fs.readFileSync("uploads/" + file);
	res.writeHead(200, {'Content-Type': 'image/jpg' });
	res.end(img, 'binary');
});

app.use('/:vetLab',myLogger, clinicUserRouter);

/* WWW AND HTTPS REDIRECTION ==> */


app.get('/*', function(req, res, next) {
	if (req.headers.host.match(/^www/) == null ) res.redirect('http://www.' + req.headers.host + req.url, 301);
	else next();
});


/* WWW AND HTTPS REDIRESCTION <== */          




var port = process.env.PORT || 3330;
server.listen(port, function() {
	console.log('Vetx server is running *:' + port);
});


