# papi-client.js
PAPI Client SDK for NodeJs

## Installation

```bash
$ npm install makeitsocial/papi-client.js --save
```

## Server-side with Express

```js
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

var pc = require('papi-client.js');
pc.route(app);
app.use('/papi', express.static(pc.staticPath));

var server = app.listen(process.env.PORT || 3000, function(){
	var addr = server.address();
	console.log('MiS server listening on", addr.address, addr.port);
});
```

## Client-side with Angular

```js
angular.module('Main',['papiclient'])
.controller('Provider', ['$scope', 'PapiClient', function($scope, PapiClient){
	PapiClient.Providers.getAll(function(data){
		$scope.providers = data;
	});
}]);
```
