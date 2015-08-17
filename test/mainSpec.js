/* global describe, it, before, after,process */
var expect = require('chai').expect;
var nock = require('nock');
var request = require('request');
process.env.PAPI_APPID = 'test';
process.env.PAPI_APPKEY = 'test';
var main = require('../lib/main.js');

describe('mainSpec', function(){
	describe('config and makeUrl', function(){
		it('should use defaults', function(){
			var url = main.makeUrl('providers','101');
			expect(url).to.equal('http://localhost:8080/api/providers/101');
		});
		it('should change host', function(){
			main({host:'localhost:3000'});
			var url = main.makeUrl('providers','101');
			expect(url).to.equal('http://localhost:3000/api/providers/101');
			main({host:'localhost:8080'}); //change back
		});
	});
	
	describe('validate', function(){
		it('should reject null data', function(){
			main.validate('',null,function(errs){
				expect(errs.messages).to.include('Invalid data object');
			});
		});
		it('should reject invalid data', function(){
			main.validate('','str',function(errs){
				expect(errs.messages).to.include('Invalid data object');
			});
		});
		it('should reject invalid template', function(){
			main.validate('temp',{},function(errs){
				expect(errs.messages).to.include('temp not found in templates');
			});
		});
		it('should reject providers with required fields', function(){
			main.validate('providers',{},function(errs){
				expect(errs.messages).to.include('name required');
				expect(errs.messages).to.include('logo required');
				expect(errs.messages).to.include('email required');
			});
		});
		it('should accept providers', function(){
			var data = {
				xid: '1', name:'n1', logo:'http', email:'a@b.c'
			};
			main.validate('providers',data,function(errs,rd){
				expect(errs).to.not.exist;
				expect(rd).to.have.property('xid','1');
			});
		});
		it('should reject products with required fields',function(){
			main.validate('products',{},function(errs){
				expect(errs).to.have.property('messages');
				expect(errs.messages).to.include('oid (provider.xid) required');
				expect(errs.messages).to.include('nm (name) required');
				expect(errs.messages).to.include('im (image url) required');
				expect(errs.messages).to.include('pr.cy required. [pr (price),cy (currency)]');
				expect(errs.messages).to.include('pr.ba required. [pr (price),ba (base price)]');
				expect(errs.messages).to.include('dr.sd required. [dr (date range),sd (starting date)]');
			});
		});
		it('should accept products',function(){
			var data = {
				xid: 'pd', oid:'1', sid:'2', nm:'pd1', im:'http',
				pr: {
					cy:'GBP',ba:100
				},
				dr: {
					sd:'2015-01-01'
				}
			};
			main.validate('products',data,function(errs,rd){
				expect(errs).to.not.exist;
				expect(rd).to.have.property('xid','pd');
				expect(rd).to.have.property('oid','1');
			});
		});
		it('should filter out unknown fields', function(){
			var data = {
				name: 'pv1', logo:'http', email:'a@b.c', data:'x'
			};
			main.validate('providers',data,function(errs,rd){
				expect(rd).to.have.property('name','pv1');
				expect(rd).to.not.have.property('data');
			});
		});
		it('should accept fields marked empty in template',function(){
			var data = {
				name: 'pv1', logo:'http', email:'a@b.c',
				xd: {a:1,b:2}, bk:{usr:{fn:'fn'}}
			};
			main.validate('providers',data,function(errs,rd){
				expect(rd).to.have.property('xd');
				expect(rd.xd).to.have.property('a',1);
				expect(rd).to.have.property('bk');
				expect(rd.bk).to.have.property('usr');
				expect(rd.bk.usr).to.have.property('fn','fn');
			});
		});
		it('should copy embedded objects',function(){
			var data = {
				oid:'1',nm:'n',im:'im',pr:{cy:'a',ba:0},
				dr:{
					sd:'2015-01-01',ds:{mn:1,mx:10}
				}
			};
			main.validate('products',data,function(errs,rd){
				expect(errs).to.not.exist;
				expect(rd).to.have.property('dr');
				expect(rd.dr).to.have.property('ds');
				expect(rd.dr.ds).to.have.property('mn',1);
				expect(rd.dr.ds).to.have.property('mx',10);
			});
		});
		it('should copy arrays', function(){
			var data = {
				oid:'1',nm:'n',im:'im',pr:{
					cy:'GBP',ba:0,
					rs:[
						{nm:'r1',a:10,c:'c1'},{nm:'r2',a:20,c:'c2'}
					]
				}, dr:{sd:'2010-01-11'}
			};
			main.validate('products',data,function(errs,rd){
				expect(errs).to.not.exist;
				expect(rd).to.have.property('pr');
				expect(rd.pr).to.have.property('rs');
				expect(rd.pr.rs).to.have.length(2);
				expect(rd.pr.rs[0]).to.eql(data.pr.rs[0]);
				expect(rd.pr.rs[1]).to.eql(data.pr.rs[1]);
			});
		});
	});
	
	describe('data access and create', function(){
		it('should getData', function(done){
			nock('http://localhost:8080').get('/api/providers').reply(200,[]);
			main.getData('http://localhost:8080/api/providers','test','test',function(err,r){
				expect(err).to.be.null;
				expect(r).to.have.length(0);
				done();
			});
		});
		it('should get product', function(done){
			nock('http://localhost:8080').get('/api/products/1').reply(500,{error:'not found'});
			main.getData('http://localhost:8080/api/products/1','test','test',function(err,r){
				expect(r).to.have.property('error','not found');
				done();
			});
		});
		it('should put data', function(done){
			nock('http://localhost:8080').put('/api/providers/0').reply(200,{status:'OK'});
			var data ={};
			main.putData('http://localhost:8080/api/providers/0',data,'test','test',function(err,r){
				expect(r).to.have.property('status','OK');
				done();
			});
		});
		it('should create a provider', function(done){
			var data = {name: 'pv1', logo:'http', email:'a@b.c'};
			nock('http://localhost:8080').post('/api/providers').reply(201,data);
			main.create('providers', data, function(er,r){
				expect(r).to.have.property('name',data.name);
				done();
			});
		});
		it('should delData', function(done){
			nock('http://localhost:8080').delete('/api/providers/10').reply(204,{status:'OK'});
			main.delData('http://localhost:8080/api/providers/10','test','test',function(err,r){
				expect(r).to.have.property('status','OK');
				done();
			});
		});
		it('should handle res_sender', function(done){
			var res = {
				status:function(st){ res._status = st; return res; },
				send:function(d){ res._data = d; }
			};
			main.res_sender(res)({error:'error'});
			expect(res._status).to.equal(500);
			expect(res._data).to.have.property('error','error');
			main.res_sender(res,201)(null,{status:'OK'});
			expect(res._status).to.equal(201);
			expect(res._data).to.have.property('status','OK');
			done();
		});
	});
	
	describe('router', function(){
		var paths = [];
		var router = {
			get: function(path, fn){
				paths.push({method:'get',path:path,func:fn});
			},
			post:function(path, fn){
				paths.push({method:'post',path:path,func:fn});
			},
			put:function(path, fn){
				paths.push({method:'put',path:path,func:fn});
			},
			delete:function(path, fn){
				paths.push({method:'delete',path:path,func:fn});
			}, 
		};
		var res = {
			status:function(st){ res._status = st; return res; },
			send:function(d){ res._data = d; }
		};
		before(function(done){
			main.route(router);
			done();
		});
		it('should have routes set', function(){
			expect(paths).to.have.length(10);
		});
		it('should support get providers', function(done){
			var p1 = paths[0];
			expect(p1).to.have.property('method','get');
			expect(p1).to.have.property('path','/papi/providers');
			expect(p1.func).to.be.a('function');
			nock('http://localhost:8080').get('/api/providers').reply(200,[]);
			res.send = function(d){
				expect(d).to.have.length(0);
				done();
			}
			p1.func({}, res);
		});
		it('should support get single provider', function(done){
			var p2 = paths[1];
			expect(p2).to.have.property('path','/papi/providers/:id');
			nock('http://localhost:8080').get('/api/providers/1').reply(200,{xid:'1'});
			res.send = function(d){
				expect(d).to.have.property('xid','1');
				done();
			};
			p2.func({params:{id:'1'}}, res);
		});
		it('should support get products', function(done){
			var p3 = paths[2];
			expect(p3).to.have.property('path','/papi/products');
			nock('http://localhost:8080').get('/api/products').reply(200,[]);
			res.send = function(d){
				expect(d).to.have.length(0);
				done();
			};
			p3.func({}, res);
		});
		it('should support single product', function(done){
			var p4 = paths[3];
			expect(p4).to.have.property('path','/papi/products/:id');
			nock('http://localhost:8080').get('/api/products/1').reply(200,{xid:'2'});
			res.send = function(d){
				expect(d).to.have.property('xid','2');
				done();
			};
			p4.func({params:{id:'1'}}, res);
		});
		it('should support post a provider', function(done){
			var p = paths[4];
			expect(p).to.have.property('path','/papi/providers');
			nock('http://localhost:8080').post('/api/providers').reply(201,{xid:'201'});
			res.send = function(d){
				expect(d).to.have.property('xid','201');
				done();
			};
			var req = {
				body: {name:'pv1',logo:'http',email:'a@b.c'}
			};
			p.func(req, res);
		});
		it('should support put a provider', function(done){
			var p = paths[5];
			expect(p).to.have.property('path','/papi/providers/:id');
			nock('http://localhost:8080').put('/api/providers/12').reply(200,{xid:'202'});
			res.send = function(d){
				expect(d).to.have.property('xid','202');
				done();
			};
			var req = {
				params: { id: '12'},
				body: {logo:'http'}
			};
			p.func(req, res);
		});
		it('should support post a product', function(done){
			var p = paths[6];
			expect(p).to.have.property('path','/papi/products');
			nock('http://localhost:8080').post('/api/products').reply(201,{xid:'203'});
			res.send = function(d){
				expect(d).to.have.property('xid','203');
				done();
			};
			var req = {
				body: {oid:'o1',nm:'pd1',im:'http',pr:{cy:'a',ba:1},dr:{sd:'1'}}
			};
			p.func(req, res);
		});
		it('should support put a product', function(done){
			var p = paths[7];
			expect(p).to.have.property('path','/papi/products/:id');
			nock('http://localhost:8080').put('/api/products/13').reply(200,{xid:'204'});
			res.send = function(d){
				expect(d).to.have.property('xid','204');
				done();
			};
			var req = {
				params: { id: '13'},
				body: {im:'http'}
			};
			p.func(req, res);
		});
		it('should support delete a provider', function(done){
			var p = paths[8];
			expect(p).to.have.property('path','/papi/providers/:id');
			nock('http://localhost:8080').delete('/api/providers/111').reply(204,{});
			res.send = function(d){
				done();
			};
			p.func({params:{id:'111'}}, res);
		});
		it('should support delete a product', function(done){
			var p = paths[9];
			expect(p).to.have.property('path','/papi/products/:id');
			nock('http://localhost:8080').delete('/api/products/112').reply(204,{});
			res.send = function(d){
				done();
			};
			p.func({params:{id:'112'}}, res);
		});

	});
});
