/* global process */
var path = require('path'),
	crypto = require('crypto'),
	request = require('request');

var PAPI_HOST = process.env.MIS_PAPI_HOST || 'localhost:8080',
	PAPI_ROOT = '/api',
	APP_ID = process.env.PAPI_APPID,
	APP_KEY = process.env.PAPI_APPKEY,
	LOCAL_PATH = '/papi';
	
/**
 * @param ops : {
 *  host: '',
 * 	appId: 'APP_ID',
 *  appKey: 'APP_KEY',
 *  path: '/papi'
 * }
 */
var fns = function(ops) {
	var opts = ops || {};
	if (opts.host){
		PAPI_HOST = opts.host;
	}
	if (opts.appId){
		APP_ID = opts.appId;
	}
	if (opts.appKey){
		APP_KEY = opts.appKey;
	}
	if (opts.path){
		LOCAL_PATH = opts.path;
		if (LOCAL_PATH.charAt(0)!='/'){
			LOCAL_PATH = '/' + LOCAL_PATH;
		}
	}
};

fns.makeUrl = function() {
	var pths = Array.prototype.slice.call(arguments).join('/').replace(/\/\//g,'/');
	if (pths.indexOf('http')==0) {
		return pths.replace(':/', '://');
	}
	if (pths.charAt(0)!='/') {
		pths = '/' + pths;
	}
	var api = (/\/(api|feeder)\//.test(pths)) ? '' : PAPI_ROOT,
		proto = /^https?:\/\//.test(PAPI_HOST) ? '' : (/localhost/.test(PAPI_HOST) ? 'http://' : 'https://');
	return proto + PAPI_HOST + api + pths;
};

fns.getData = function(url, appId, appKey, cb){
	request({
		method: 'GET',
		url: url,
		json: true,
		auth: {
			username: appId || APP_ID,
			password: appKey || APP_KEY
		}
	}, function(e, r, body){
		//console.log('!!, request return:',e,r,body);
		if (e) return cb(e);
		cb(null, body);
	});
};

fns.postData = function(url, body, appId, appKey, cb, put){
	var data = {
		method: put || 'POST',
		url: url,
		body: body,
		json: true,
		auth: {
			username: appId || APP_ID,
			password: appKey || APP_KEY
		}
	};
	request(data, function(e, r, body) {
		if (e) return cb(e);
		cb(null, body);
	});
};

fns.putData = function(url, body, appId, appKey, cb){
	fns.postData(url, body, appId, appKey, cb, 'PUT');
};

function makeHash(hashkey, ss) {
	var ds = Array.isArray(ss) ? ss.join('') : ss;
	var hash = crypto.createHash('sha256')
		.update(ds)
		.update(hashkey)
		.digest('base64');
	return hash;
}

fns.Provider = {
	template: {
		_id:'',xid:'',name:'',desc:'',logo:'',email:'',
		pay:{method:'',sid:'',live:false},
		bk:{tc:'',e:'local',webhook:'',hashkey:''}
	},
	validate: function(data){
		var errs = [];
		if (!data || typeof(data)!='object'){
			return ['Invalid data object'];
		}
		var reqs = {name:1,logo:1,email:1,pay:1,bk:1};
		for (var k in reqs){
			if (!data[k]){
				errs.push(k + ' required');
			}
		}
		if (data.pay){}
		return errs;
	},
	sanitize: function(data){
		var data2 = {};
		//TODO: filter valid data only
		for (var k in data){
			data2[k] = data;
		}
		return data2;
	},
	create: function(data, cb){
		var errs = fns.Provider.validate(data);
		if (errs && errs.length>0){
			return cb(null, {status:'FAIL', messages:errs});
		}
		var data2 = fns.Provider.sanitize(data);
		var url = fns.makeUrl('providers');
		fns.postData(url, data2, APP_ID, APP_KEY, cb);
	}
};

var TEMPLATES = {
	providers: {
		xid: '', name: '*', logo: '*', email: '*',
	},
	products: {
		xid: '', oid: '*', sid: '', nm: '*', im: '*',
	}
};

fns.validate = function(entity, data, cb){
	var errs = [];
	if (!data || typeof(data)!='object'){
		return cb(['Invalid data object']);
	}
	var data2 = {}, template = TEMPLATES[entity];
	function validit(templ, data, data2){
		for (var k in templ) {
			var tv = templ[k];
			if (data[k]){
				if (Array.isArray(tv)){
					data2[k] = [];
					for (var i=0; i<tv.length; i++){
						validit(tv, )
					}
				}
			}
		}
	}
	validit(template, data, data2);
	for (var k in template){
		var tv = template[k];
		if (data[k]){
			if (Array.isArray(tv)){
				//
			}
			else if (typeof(tv)=='object'){
				//only 2-levels
			}
		}
		data2[k] = data;
	}
	cb(null, data2);
};

/**
 * Create an object of Provider or Product.
 * @param entity : 'providers' or 'products'
 * @param data : {..}
 */
fns.create = function(entity, data, cb){
	var errs = fns.validate(entity, data);
	if (errs && errs.length>0){
		return cb(null, {status:'FAIL', messages:errs});
	}
	//data = fns.sanitize(data, TEMPLATES[entity]);
	var url = fns.makeUrl(entity);
	fns.postData(url, data, APP_ID, APP_KEY, cb);
};

fns.Product = {
	validate: function(data){
		var errs = [];
		return errs;
	},
	create: function(data, cb){
		var errs = fns.Product.validate(data);
		if (errs && errs.length>0){
			return cb(null, {status:'FAIL', messages:errs});
		}
		var data2 = fns.Provider.sanitize(data);
		var url = fns.makeUrl('products');
		fns.postData(url, data2, APP_ID, APP_KEY, cb);
	}
};

fns.route = function(app){
	app.get(LOCAL_PATH + '/providers', function(req, res){
		var url = fns.makeUrl('providers');
		req.pipe(request.get(url).auth(APP_ID, APP_KEY)).pipe(res);
	});
	app.get(LOCAL_PATH + '/providers/:id', function(req, res){
		var url = fns.makeUrl('providers', req.params.id);
		req.pipe(request.get(url).auth(APP_ID, APP_KEY)).pipe(res);
	});
	app.get(LOCAL_PATH + '/products', function(req, res){
		var url = fns.makeUrl('products');
		req.pipe(request.get(url).auth(APP_ID, APP_KEY)).pipe(res);
	});
	app.get(LOCAL_PATH + '/products/:id', function(req, res){
		var url = fns.makeUrl('products', req.params.id);
		req.pipe(request.get(url).auth(APP_ID, APP_KEY)).pipe(res);
	});
	app.post(LOCAL_PATH + '/providers', function(req, res){
		fns.Provider.create(req.body, function(err, r){
			if (err) return res.send(500, err);
			res.send(r);
		});
	});
	app.put(LOCAL_PATH + '/providers/:id', function(req, res){
		var url = fns.makeUrl('providers', req.params.id);
		fns.putData(url, req.body, APP_ID, APP_KEY, function(err, r){
			if (err) return res.send(500, err);
			res.send(r);
		});
	});
	app.post(LOCAL_PATH + '/products', function(req, res){
		fns.Product.create(req.body, function(err, r){
			if (err) return res.send(500, err);
			res.send(r);
		});
	});
	app.put(LOCAL_PATH + '/products/:id', function(req, res){
		var url = fns.makeUrl('products', req.params.id);
		fns.putData(url, req.body, APP_ID, APP_KEY, function(err, r){
			if (err) return res.send(500, err);
			res.send(r);
		});
	});
	app.del(LOCAL_PATH + '/providers/:id', function(req, res){
		var url = fns.makeUrl('providers', req.params.id);
		request.del(url).auth(APP_ID, APP_KEY).pipe(res);
	});
	app.del(LOCAL_PATH + '/products/:id', function(req, res){
		var url = fns.makeUrl('products', req.params.id);
		request.del(url).auth(APP_ID, APP_KEY).pipe(res);
	});
};

module.exports = fns;
