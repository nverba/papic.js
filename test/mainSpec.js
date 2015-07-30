/* global describe, it, before, after */
var expect = require('chai').expect;
var nock = require('nock');
var request = require('request');
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
				expect(errs.messages).to.include('oid required');
				expect(errs.messages).to.include('nm required');
				expect(errs.messages).to.include('im required');
				expect(errs.messages).to.include('pr.cy required');
				expect(errs.messages).to.include('pr.ba required');
				expect(errs.messages).to.include('dr.sd required');
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
	
	describe('create', function(){
		it('should create a provider', function(done){
			var data = {name: 'pv1', logo:'http', email:'a@b.c'};
			nock('http://localhost:8080').post('/api/providers').reply(201,data);
			main.create('providers', data, function(er,r){
				expect(r).to.have.property('name',data.name);
				done();
			});
		});
	});
	
	// describe('endpoints', function(){
	// 	it('should have get /providers', function(done){
	// 		nock('http://localhost:8080').get('/api/providers').reply(200,[]);
	// 		request.get('http://localhost:3000/papi/providers',function(e,r,bd){
	// 			console.log(e,' - ', bd);
	// 			expect(bd).to.have.length(0);
	// 			done();
	// 		});
	// 	});
	// });
});
