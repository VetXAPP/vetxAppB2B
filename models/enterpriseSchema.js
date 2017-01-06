var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var enterpriseSchema = new Schema({
	title:String,
	description:[],
	price:String,
	tenure:String
});
module.exports = mongoose.model('Enterprise', enterpriseSchema);
