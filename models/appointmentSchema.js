var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var appointmentSchema = new Schema({
    date:{type: String},
    time:{type: String},
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pet:{type: Schema.Types.ObjectId, ref: 'Pet'},
    active: {
        type: Boolean,
        default:true
    }

});
module.exports = mongoose.model('appointment', appointmentSchema);
