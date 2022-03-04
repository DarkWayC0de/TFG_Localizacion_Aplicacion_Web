
const express = require("express");
const router = express.Router(); 

router.use(function(req, res, next) {
    console.log('/' + req.method);
    next();
})

router.get('/', function(req, res) {
    res.redirect('tracking/mostrar');
})




module.exports = router;