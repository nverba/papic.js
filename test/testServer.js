var express = require('express');
var app = express();

var papi_client = require('../lib/main.js');
app.use('/papi', express.static(papi_client.staticPath));

var bodyParser = require('body-parser');
app.use(bodyParser.json());

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// endpoint to test pl frontend
// app.get('/scrapi', function(req, res,next){
//     var n = req.url.indexOf('?'), ps = req.url.substr(n);
//     console.log('\n---- router.get. url=', req.url, ', ps=', ps);
//     if (ps == '/') ps = '';
//     res.redirect('/popup.html'+ps);
// });

// scrapi.init({
//     papi: {
//         url: process.env.MIS_PAPI_HOST || 'localhost:8080',
//         username: process.env.PAPI_CLIENTID || 'makeitso',
//         password: process.env.PAPI_SECRET || '123456',
//         hashkey: 'makeitso'
//     },
//     gapi: {
//         url: process.env.MIS_GAPI_HOST || 'localhost:8000',
//         username: process.env.GAPI_CLIENTID || 'makeitso',
//         password: process.env.GAPI_SECRET || '123456'
//     },
// });
// scrapi.listen(server);
// scrapi.route(app);

var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    var addr = server.address();
    console.log("MiS server listening at", addr.address + ":" + addr.port);
});
