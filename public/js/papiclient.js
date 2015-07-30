var _angular = typeof(angular)=='undefined' ? false : true;

if (_angular) {
	angular.module('papiclient', [])
	.factory('PapiClient', ['$http', function($http){
		return new PapiClient($http);
	}]);
}

var PapiClient = function($http){
	var pfx = '/papi', self = this,
		HDRJSON = {'Content-Type':'application/json','accept':'application/json'};
	
	function doReq(methods, url, data, callback) {
		var req = {method:methods,url:url,headers:HDRJSON},
			ajax = (_angular ? $http : ($http || jQuery).ajax);
		if (methods=='POST' || methods=='PUT' && data){
			req.data = data;
		}
		//jQuery 1.5+ success=>done, error=>fail
		ajax(req).success(callback).error(function(arg1,arg2,arg3){
			if(callback){
				callback({error:'Ajax call error ' + arg1});
			}
			// jqXHR, textStatus, errorThrown for jquery
			// data, status, headers, config for angular
		});
	}
	
	function doGet(url, cb) {
		if (url.indexOf(pfx)!=0) url = pfx + url;
		doReq('GET', url, null, cb);
	}
	
	function doPost(url, data, cb) {
		if (url.indexOf(pfx)!=0) url = pfx + url;
		doReq('POST', url, data, cb);
	}
	
	function doPut(url, data, cb) {
		if (url.indexOf(pfx)!=0) url = pfx + url;
		doReq('PUT', url, data, cb);
	}
	
	function doDelete(url, cb) {
		if (url.indexOf(pfx)!=0) url = pfx + url;
		doReq('DELETE', url, null, cb);
	}
	
	this.Providers = {
		getAll: function(cb){
			doGet('/providers', cb);
		},
		getOne: function(id, cb){
			doGet('/providers/'+id, cb);
		},
		create: function(data, cb){
			doPost('/providers', data, cb);
		},
		update: function(id, data, cb){
			doPut('/providers/'+id, data, cb);
		},
		remove: function(id, cb){
			doDelete('/providers/'+id, cb);
		}
	};

	this.Products = {
		getAll: function(cb){
			doGet('/products', cb);
		},
		getOne: function(id, cb){
			doGet('/products/'+id, cb);
		},
		create: function(data, cb){
			doPost('/products', data, cb);
		},
		update: function(id, data, cb){
			doPut('/products/'+id, data, cb);
		},
		remove: function(id, cb){
			doDelete('/products/'+id, cb);
		}
	};
};
