/**********************************************************
*
* INFANTRY MODELS
* Users Model Definition
*
* Authors: David DeRemer
*
**********************************************************/

// Set module imports
var mongoose = require('mongoose'),
		_u = require('../util/underscore-extended');

// Set schema variables
var Schema = mongoose.Schema,
  	Mixed = Schema.Types.Mixed,
    ObjectId = Schema.ObjectId,
    ObjectIdType = mongoose.Types.ObjectId;




/**********************************************************
* Model Definition Function
**********************************************************/
exports.define = function (app, connection) {


	
	/**********************************************************
	* Embedded document schemas
	**********************************************************/

	// Define schemas to embed here
	// before using them in main model
		
		
	/**********************************************************
	* Schema definition 
	**********************************************************/

	var User = new Schema ({
	  								
	  modOn    		: { 	type : Number
	  								, required: true
	  								, validate: [_u.isFinite, 'modOn must be number']
	  								, 'default': new Date().valueOf() 
	  							},
	
		info				:	{ 
	  								fName	 		: { 	type : String
	  															, validate: [_u.isNotEmptyString, 'fName must be non-empty string']
	  														},
										lName	 		: { 	type : String 
																	, validate: [_u.isNotEmptyString, 'lName must be non-empty string']
																},
										search		: { 	type : [] 
																	, select : false
																	// Search is an array containing fName and lName for ease of name search
																},
										city	 		: { 	type : String
																	, validate: [_u.isNotEmptyString, 'city must be non-empty string']
																},
										state	 		: { 	type : String
																	, validate: [_u.isNotEmptyString, 'state must be non-empty string']
																},
										phone	 		: { 	type : String 
																	, validate: [_u.isNotEmptyString, 'phone must be non-empty string']
																},
										email			: { 	type : String
																	, required  : true
																	, lowercase : true
																	, select : false
																},
										gender	 	: { 	type : Boolean
																	, enum : [ 'male', 'female', 'unknown' ] 
																},
										birthYear	: { 	type : Number
																	, validate: [function(val) { return (val >= 1900 && val =< new Date().getFullYear()) }, 'birthYear must be YYYY']
																}
									},
	
		photo				: {
								  	orig 			: { 	type: String 
								  								, validate: [_u.isNotEmptyString, 'orig must be non-empty string']
								  							},
								  	sizes 		: { 	type: [] 
								  							}
								  },
	  
	  options			: {
	  								autoFollow: { 	type: Boolean 
								  							}
	  							}
	  
	});
	
	
	/**********************************************************
	* Indexes
	**********************************************************/

	User.index({ 'user': 1 }, {unique: true});
	User.index({ 'info.email': 1 });
	User.index({ 'info.email_lc': 1 }, {unique: true}); 	
	User.index({ 'info.search': 1 });
	
	
	/**********************************************************
	* Virtuals and middleware
	**********************************************************/

	User.virtual('id')
	    .get(function() { return this._id.toHexString(); });

	User.virtual('fullName')
	  	.set(function(name) {
	  		var split = name.split(' ');
	    	this.set('info.fName', split[0]);
	    	this.set('info.lName', split[1]);
	  	})
	  	.get(function() { return this.info.fName + ' ' + this.info.lName; });
	
	User.virtual('abbrName')
			.get(function() {
				var abbr = this.info.fName;
				if (this.info.lName && this.info.lName.length > 0) { abbr += ' ' + this.info.lName.charAt(0) + '.'; }
				return abbr; 
			});
	
	User.pre('save', function(next) {
	  this.modOn = new Date().valueOf();
	  this.info.search = [];
	  if (this.info.fName) { this.info.search.push(this.info.fName); }
	  if (this.info.lName) { this.info.search.push(this.info.lName); }
	  next();
	});
	
	
	/**********************************************************
	* Methods: manipulate a record
	**********************************************************/
	
	User.method('setupUser', function(uObj, callback) {
		if (_u.hasAllKeys(uObj, ['email'])) {
	    if (_u.isObject(uObj.info)) {
	    	if (_u.isNotEmptyString(uObj.fullName)) { this.fullName = uObj.info.fullName; }
	    	for (var key in uObj.info) { this.info[key] = uObj.info[key]; } 
	    }
	    if (_u.isObject(uObj.photo)) { for (var key in uObj.photo) { this.photo[key] = uObj.photo[key]; } }
	    if (_u.isObject(uObj.options)) { for (var key in uObj.options) { this.options[key] = uObj.options[key]; } }
		  this.save(function(err) {
		  	if (err) { callback(err); }
		  	else { callback(); }
		  });
		} else { callback('Missing required fields to create new user'); }
	});
	
	
	User.method('updateUser', function(uObj, callback) {
		if (_u.isObject(uObj)) {
			if (_u.isObject(uObj.info)) {
	    	if (_u.isNotEmptyString(uObj.fullName)) { this.fullName = uObj.info.fullName; }
	    	for (var key in uObj.info) { this.info[key] = uObj.info[key]; } 
	    }
	    if (_u.isObject(uObj.photo)) { for (var key in uObj.photo) { this.photo[key] = uObj.photo[key]; } }
	    if (_u.isObject(uObj.options)) { for (var key in uObj.options) { this.options[key] = uObj.options[key]; } }
		  this.save(function(err) {
		  	if (err) { callback(err); }
		  	else { callback(); }
		  });
		} else { callback(); }
	});
	
	
	User.method('addPhoto', function(orig, sizes, callback) {
		if (!_u.isNotEmptyString(orig)) { callback('Missing required field: orig'); }
		else {
			this.photo.orig = orig;
			if (_u.isArray(sizes)) { this.photo.sizes = sizes; }		
			this.save(function(err) {
		  	if (err) { callback(err); }
		  	else { callback(); }
		  });
		}
	});
	
	
	User.method('addOptions', function(optObj, callback) {
		if (!_u.isObject(optObj)) { callback('Missing required field: optObj'); }
		else {
			for (var key in uObj.options) { this.options[key] = uObj.options[key]; } }
			this.save(function(err) {
		  	if (err) { callback(err); }
		  	else { callback(); }
		  });
		}
	});
	
	
	User.method('remOptions', function(optObj, callback) {
		if (!_u.isObject(optObj)) { callback('Missing required field: optObj'); }
		else {
			for (var key in uObj.options) { this.options[key] = undefined; } }
			this.save(function(err) {
		  	if (err) { callback(err); }
		  	else { callback(); }
		  });
		}
	});
	
		
	/**********************************************************
	* Statics: manipulate a model
	**********************************************************/
	
	User.statics.updateUser = function(uId, uObj, callback) {
		if (uId && uObj) {
			this.findById(uId, function(err, result) {
				if (err) { callback(err); }
				else if (result) { 
					result.updateUser(uObj, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('User not found'); }
			});
		} else { callback('Missing required field'); }
	};
	
	User.statics.addPhoto = function(uId, orig, sizes, callback) {
		if (uId && orig && sizes) {
			this.findById(uId, function(err, result) {
				if (err) { callback(err); }
				else if (result) { 
					result.addPhoto(orig, sizes, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('User not found'); }
			});
		} else { callback('Missing required field'); }
	};
	
	User.statics.addOptions = function(uId, optObj, callback) {
		if (uId && optObj) {
			this.findById(uId, function(err, result) {
				if (err) { callback(err); }
				else if (result) { 
					result.addOptions(optObj, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('User not found'); }
			});
		} else { callback('Missing required field'); }
	};
	
	User.statics.remOptions = function(uId, optObj, callback) {
		if (uId && optObj) {
			this.findById(uId, function(err, result) {
				if (err) { callback(err); }
				else if (result) { 
					result.remOptions(optObj, function(err) {
						if (err) { callback(err); }
						else { callback(null, result); }
					});
				} else { callback('User not found'); }
			});
		} else { callback('Missing required field'); }
	};
	
			
	
	
	/**********************************************************
	* Statics: return model
	**********************************************************/
	
	return connection.model('User', User);
}
