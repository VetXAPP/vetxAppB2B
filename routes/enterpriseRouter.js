var express = require('express'),
enterpriseRouter = express.Router(),
Enterprise = require('../models/enterpriseSchema');

enterpriseRouter.post('/new', function(req, res) {
    formData = {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
    };
    new Enterprise(formData).save(function(err) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json({
                message: "enterprise details saved"
            });
        });
});

enterpriseRouter.get('/fetch', function(req, res) {
    Enterprise.find({}, function(err, enterprise) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            res.status(200).json(enterprise);
        });
});
//CLICNIC  SIGNUP MODULE
enterpriseRouter.get('/signUp', function(req, res) {
    Enterprise.find({}, function(err, enterprise) {
        if (err) res.status(500).json({
            message: "internal server error"
        });
            var info={"pageStatus":1,"enterPriceinfo":enterprise};
            res.render("order",info);
            //res.status(200).json(enterprise);
        });
});
module.exports = enterpriseRouter;
