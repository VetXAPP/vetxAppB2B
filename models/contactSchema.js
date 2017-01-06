var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var csvSchema = new Schema({
result:[]
});
module.exports = mongoose.model('Contact',csvSchema);
