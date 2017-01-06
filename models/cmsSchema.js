var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cmsSchema = new Schema({
logoImage:String,
bannerImage:String,
bannerMainText:String,
bannerSubText:String,
boxTitle01:String,
boxContent01:String,
boxIcon01:String,
boxTitle02:String,
boxContent02:String,
boxIcon02:String,
boxTitle03:String,
boxContent03:String,
boxIcon03:String,
testimosnialsName01:String,
testimosnialsTitle01:String,
testimosnialsText01:String,
testimonialsLogo01:String,
testimosnialsName02:String,
testimosnialsTitle02:String,
testimosnialsText02:String,
testimonialsLogo02:String,
clinicName:{type:String,unique:true}
});
module.exports = mongoose.model('Cmscontent', cmsSchema);
