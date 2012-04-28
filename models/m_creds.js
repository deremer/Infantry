/**********************************************************
*
* INFANTRY MODELS
* Authors: David DeRemer
* Creds Model Definition
*
**********************************************************/

// Set module imports
var mongoose = require('mongoose'),
		crypto = require('crypto'),
		_u = require('underscore-extended');

// Set schema variables
var Schema = mongoose.Schema,
  	Mixed = Schema.Types.Mixed,
    ObjectId = Schema.ObjectId;




/**********************************************************
* Model Definition Function
**********************************************************/
exports.define = function (app, connection) {

	// Include other models for populate
	//var USER;	
	//var	users = require('./users.js');
	//users.define(function(model) { USER = model; });


	// Define available user types
	var userRoles = [
										'guest'
									, 'normal'
									, 'super'
									, 'admin'
									, 'partner'
									, 'partner-admin'
									, 'celebrity'
									];
	
	
	/**********************************************************
	* Embedded document schemas
	**********************************************************/

	// Define schemas to embed here
	// before using them in main model
		
		
	/**********************************************************
	* Creds schema definition 
	**********************************************************/

	var Cred = new Schema ({
	  								
	  modOn    		: { 	type : Number
	  								, required: true
	  								, validate: [_u.isFinite, 'modOn must be number']
	  							},
	 	
	 	user    		: { 	type : ObjectId
	  								, required: true
	  								//, ref: 'User'
	  							}, 						

	  un    			: { 	type : String
	  								, validate: [_u.isNotEmptyString, 'username must be non-empty string']
	  								, required : true
	  								, lowercase: true
	  							},
	  							
	  hash_pw    	: { 	type : String
	  								, required: true 
	  								, validate: [_u.isNotEmptyString, , 'password must be non-empty string']
	  								, select: false
	  							},
	  							
	  							
	  salt				: { 	type : String
	  								, required: true 
	  								, validate: [_u.isNotEmptyString, , 'password must be non-empty string']
	  								, select: false
	  							},
	  							
	  active	    : { 	type : Boolean
	  								, required: true
	  							},
	  							
	  role	 			: {
	  									type : String
	  								, required: true
	  								, enum: userRoles
	  								, 'default' : 'normal'
	  							},
	  
	  tokens			: {
	  									type : []
	  							},
	  
	  flags				: {
	  									type : {}
	  									// Flags in use:
	  									// 'chgpw' : designates user needs to 
	  							}
	  
	});
	
	
	/**********************************************************
	* Indexes
	**********************************************************/

	Cred.index({ 'un': 1 }, {unique: true}); 
	Cred.index({ 'user': 1 }, {unique: true, sparse: true}); 
	
	
	/**********************************************************
	* Virtuals and middleware
	**********************************************************/

	Cred.virtual('id')
	    .get(function() { return this._id.toHexString(); });
	
	Cred.virtual('password')
	  	.set(function(password) {
	    	this._password = password;
		    this.salt = this.makeSalt(this.user);
		    this.hash_pw = this.encryptPassword(password);
	  	})
	  	.get(function() { return this._password; });
	
	Cred.pre('save', function(next) {
	  this.modOn = new Date().valueOf();
	  if (_u.isUndefined(this.flags)) { this.flags = {}; }
	  next();
	});
	
	
	/**********************************************************
	* Methods: manipulate a record
	**********************************************************/
	
	Cred.method('makeSalt', function(seed) {
	  return Math.round((new Date().valueOf() * Math.random())) + seed;
	});
	
	Cred.method('encryptPassword', function(password) {
	  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
	});
	
	Cred.method('authenticate', function(plainText) {	
	  return this.encryptPassword(plainText) === this.hash_pw;
	});
	
	Cred.method('makeToken', function(seed) {	
		var tokenSalt = this.makeSalt(seed);
	 	return crypto.createHmac('md5', tokenSalt).digest('hex');
	});
	
	Cred.method('setupCred', function(uObj, callback) {
		var self = this;
	
		if (_u.isEmpty(uObj)) { callback('Missing required field to setup user'); }
		else { 	
			if (_u.hasAllKeys(uObj, ['user', 'un', 'pw'])) {
				this.user = uObj.user;
				this.un = uObj.un;
				this.password = uObj.pw;
				this.active = true;
				if (uObj.role) { this.role = uObj.role; }
				this.tokens.push({'token': this.makeToken(uObj.un)});
				this.save(function(err) {
					if (err) { callback(err); }
					else { callback(); }
				});
			} else { callback('Missing required field'); }
		}
	});
	
	Cred.method('chgUn', function(un, callback) {
		this.un = un;
		this.save(function(err) {
			if (err) { callback(err); }
			else { callback(); }
		});
	});
	
	Cred.method('chgPassword', function(pw, setChgFlag, callback) {
		if (!_u.isNotEmptyString(pw)) { callback('Missing required field to change password'); }
		else {
			this.password = pw;
			if (setChgFlag && setChgFlag == true) { this.flags.chgpw = true; }
			else if (this.flags.chgpw) { this.flags.chgpw = undefined; }
			this.save(function(err) {
				if (err) { callback(err); }
				else { callback(); }
			});
		}
	});
	
	Cred.method('chgRole', function(role, callback) {
		this.role = role;
		this.save(function(err) {
			if (err) { callback(err); }
			else { callback(); }
		});
	});
	
	Cred.method('chgActive', function(callback) {
		this.active = !this.active;
		this.save(function(err) {
			if (err) { callback(err); }
			else { callback(); }
		});
	});
	
	// Change the token
	Cred.method('chgToken', function(id, callback) {
		if (id) {
			this.tokens.forEach(function(token) {
				if (id == token.token) { delete token; }
			});
		}
		this.tokens.push({'token': this.makeToken(uObj.un)});
		this.save(function(err) {
			if (err) { callback(err); }
			else { callback(); }
		});		
	});
	
		
	/**********************************************************
	* Statics: manipulate a model
	**********************************************************/
	
	Cred.statics.validUn = function(un, callback) {
		// validate availability of a username
		this.count({'un' : un.toLowerCase()}, function(err, result) {
			if (err) { callback(err); }
			else { callback(null, result); }
		});
	};
	
	Cred.statics.chgUn = function(user, un, callback) {
		if (user && un) {
	 		this.findOne({'user':user}, function(err, result) {
				if (err) { callback(err); }
				else if (result) {
					result.chgUn(un, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('Cred not found'); }
			});
		} else { callback('Missing required fields: user, un'); }
	};
	
	Cred.statics.chgPassword = function(user, pw, setChgFlag, callback) {
		if (user && pw) {
			this.findOne({'user':user}, function(err, result) {
				if (err) { callback(err); }
				else if (result) {
					result.chgPassword(pw, setChgFlag, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('Cred not found'); }
			});
		} else { callback('Missing required fields: user, pw'); }
	};
	
	Cred.statics.chgRole = function(user, role, callback) {
		if (user && role) {
			this.findOne({'user':user}, function(err, result) {
				if (err) { callback(err); }
				else if (result) {
					result.chgRole(function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('Cred not found'); }
			});
		} else { callback('Missing required fields: user, role'); }
	};
	
	Cred.statics.chgActive = function(user, callback) {
		if (user) {
			this.findOne({'user':user}, function(err, result) {
				if (err) { callback(err); }
				else if (result) {
					result.chgActive(function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('Cred not found'); }
			});
		} else { callback('Missing required fields'); }
	};
	
	Cred.statics.chgToken = function(user, app, callback) {
		if (user) {
			this.findOne({'user':user}, function(err, result) {
				if (err) { callback(err); }
				else if (result) {
					result.chgToken(app, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('Cred not found'); }
			});
		} else { callback('Missing required fields: user'); }
	};
	
	Cred.statics.addService = function(user, name, sId, token, callback) {
		if (user && name && sId && token) {
			this.findOne({'user':user}, function(err, result) {
				if (err) { callback(err); }
				else if (result) {
					result.addService(name, sId, token, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('Cred not found'); }
			});
		} else { callback('Missing required fields: user, name, serviceID, token'); }
	};	
	
	
	
	/**********************************************************
	* Statics: return model
	**********************************************************/
	
	return connection.model('Cred', Cred);
}
