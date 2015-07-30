/* global process */
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var papi_client = require('../lib/main.js');
app.use('/papi', express.static(papi_client.staticPath));
papi_client.route(app);

app.post('/',function(req,res){
    console.log(':::: headers:',req.headers);
    console.log(':::: req.body:',JSON.stringify(req.body,null,4));
    res.send({status:'OK'});
});

var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    var addr = server.address();
    console.log("MiS server listening at", addr.address + ":" + addr.port);
});
