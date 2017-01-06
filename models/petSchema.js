var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var petSchema = new Schema({
    petName: String,
    petType: String,
    petBreed: String,
    petSex: String,
    dateOfBirth: String,
    petPhoto: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    vaccination: String,
    labImage: String,
    prescription: String,
    otherRecords: String,
    healthCertificate: String,
    active: {
        type: Boolean,
        default:true
    }
});
module.exports = mongoose.model('Pet', petSchema);
