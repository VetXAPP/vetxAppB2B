 var mongoose = require('mongoose');
 var Schema = mongoose.Schema;
 var consultationSchema = new Schema({
     user: {
         type: Schema.Types.ObjectId,
         ref: 'User'
     },
     Clinic: {
         type: Schema.Types.ObjectId,
         ref: 'Clinic'
     },
     pet: {
         type: Schema.Types.ObjectId,
         ref: 'Pet'
     },
     summary: String,
     date: {
         type: Date,
         default: Date.now
     },
     billingNo: String
 });
 module.exports = mongoose.model('Consultation', consultationSchema);
