var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var autoIncrement = require('mongoose-auto-increment');
var callSchema = new Schema({
// clinicId:{type: Schema.Types.ObjectId, ref: 'Clinic'},
clinicName:{type: String},
amt:{type: String},
summary:{type: String},
paymentStatus:{
	type: Boolean,
	default: false
},
userId:{type: Schema.Types.ObjectId, ref: 'User' },
DoctorId:{type: Schema.Types.ObjectId, ref: 'Doctor'},
petId:{type: Schema.Types.ObjectId, ref: 'Pet'},
callInitiated:Boolean,
callAccepted: {
	type: Date,
	default: Date.now
},
consultingPrice:String,
callEnd:{
	type: Boolean,
	default: false
},
callIsEnded: {
	type: Date
}
// autoId: {
// 	type: Number,
// 	default: 1221,
// 	unique: true
// },
});
module.exports = mongoose.model('Call',callSchema);

// callSchema.plugin(autoIncrement.plugin, {
// 	model: 'Call',
// 	field: 'autoId'
// });
