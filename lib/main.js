/* global process */
var request = require('request');

var PAPI_HOST = process.env.MIS_PAPI_HOST || 'localhost:8080',
	PAPI_ROOT = '/api',
	APP_ID = process.env.PAPI_APPID || 'test',
	APP_KEY = process.env.PAPI_APPKEY || 'test',
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
			user: appId,
			pass: appKey
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
			user: appId,
			pass: appKey
		}
	};
	//console.log('postData, url=',url,', data=',data);
	request(data, function(e, r, body) {
		if (e) return cb(e);
		cb(null, body);
	});
};

fns.putData = function(url, body, appId, appKey, cb){
	fns.postData(url, body, appId, appKey, cb, 'PUT');
};

var TEMPLATES = {
	providers: {
		xid: '', name: '*', logo: '*', email: '*', desc: '',
		notify: {
			webhook: '', hashkey: '', email: ''
		},
		pay: {
			method: '', sid: '', live: false
		},
		addr: {
			addr1:'',addr2:'',city:'',postcode:'',county:'',country:''
		},
		bk: {
			tc: '', fee: 0, 
			usr: {}
		},
		xd: {}
	},
	products: {
		xid: '', oid: '*', sid: '', nm: '*', im: '*', url:'', nt:'', pt:'',
		pr: {
			cy:'*',ba:1,tp:'',du:'',qu:false,dp:0,pa:false,dl:'',mn:0,
			rs:[
				{nm:'*',a:1,c:'*',sc:0,rr:''}
			],
			pd:[
				{a:1,rr:'',c:'*',sc:0}
			],
			gd:[
				{m:1,a:1,c:'*',sc:0,rr:'',ts:[]}
			],
			vc:[
				{c:'*',q:0,a:1,rr:'',ts:[]}
			]
		},
		db:{
			e:'',f:0,q:0,it:''
		},
		dr:{
			sd:'*',ed:'',du:'',tp:'',rr:'',
			ds:{
				mn:0,mx:0
			},
			ts:[
				{c:'*',s:'*',e:'',d:'',rr:''}
			]
		},
		gs:{
			mn:0,mx:0,bt:false
		},
		sc:[
			{
				n:1, t:'', c:'*', rr:''
			}
		],
		ex:[
			{
				xid:'', nm:'*', im:'', nt:'', ct:'', rr:'', mn:0,mx:0,gd:false, pr:{}
			}
		],
		xd:{}
	}
};
// for content-type is application/x-www-form-urlencoded, using extended qs library (body-parser)
// xid=1&pr[cy]=GBP&pr[rs][0][nm]=aa&pr[rs][0][a]=10

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

fns.validate = function(entity, data, cb){
	var errs = [];
	if (!data || typeof(data)!='object'){
		return cb({messages:['Invalid data object']});
	}
	
	function validit(templ, d1, d2){
		for (var k in templ) {
			var tv = templ[k];
			if (typeof(d1[k])!='undefined'){
				if (Array.isArray(tv)){
					if (tv.length==0){
						d2[k] = d1[k];
					} else {
						d2[k] = [];
						for (var i=0; i<d1[k].length; i++){
							d2[k].push({}); //[1,'b'] not allowed, only [{},..]
							// console.log('recurse array:',tv[0],'\n',d1[k][i],'\n',d2[k],'\n\n');
							validit(tv[0], d1[k][i], d2[k][d2[k].length-1]);
						}
					}
				} else if (typeof(tv)=='object'){
					if (isEmpty(tv)){
						d2[k] = d1[k];
					} else {
						d2[k] = {};
						validit(tv, d1[k], d2[k]);
					}
				} else {
					d2[k] = d1[k];
				}
			} else if (tv == '*' || tv > 0 || tv == true){
				errs.push(k + ' required');
			} else if (typeof(tv)=='object'){
				for (var x in tv){
					var tvx = tv[x];
					if (tvx == '*' || tvx > 0 || tvx == true){
						errs.push(k + '.' + x + ' required');
					}
				}
			}
		}
	}
	
	var data2 = {}, template = TEMPLATES[entity];
	if (!template) {
		return cb({messages:[entity + ' not found in templates']});
	}
	validit(template, data, data2);
	if (errs.length > 0){
		return cb({messages:errs});
	}
	cb(null, data2);
};

/**
 * Create an object of Provider or Product.
 * @param entity : 'providers' or 'products'
 * @param req : {..}
 */
fns.create = function(entity, data, cb){
	fns.validate(entity, data, function(err, r){
		if (err){
			return cb(err);
		}
		if (r.error){
			return cb(null, r);
		}
		var url = fns.makeUrl(entity);
		fns.postData(url, r, APP_ID, APP_KEY, cb);
	});
};

fns.route = function(app){
	app.get(LOCAL_PATH + '/providers', function(req, res){
		var url = fns.makeUrl('providers');
		console.log('-> GET ', req.url, ', url=',url);
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
		fns.create('providers', req.body, function(err, r){
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
		fns.create('products', req.body, function(err, r){
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
	app.delete(LOCAL_PATH + '/providers/:id', function(req, res){
		var url = fns.makeUrl('providers', req.params.id);
		request.del(url).auth(APP_ID, APP_KEY).pipe(res);
	});
	app.delete(LOCAL_PATH + '/products/:id', function(req, res){
		var url = fns.makeUrl('products', req.params.id);
		request.del(url).auth(APP_ID, APP_KEY).pipe(res);
	});
};

fns.staticPath = __dirname + '/public';

module.exports = fns;
