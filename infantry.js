/**********************************************************
*
* INFANTRY
* A quick and easy way to add users to Express Apps
*
* Authors: David DeRemer
*
**********************************************************/

var _u = require('underscore'),
		mongoose = require('mongoose');


var Infantry = function(config) {
	if (_u.isEmpty(config) || !_u.has(config, 'dbUri')) { throw new Error('Invalid Config Object'); }
	else {
		this.dbUri = config.dbUri;
	}
};


Infantry.prototype.mount = function(app) {
	var self = this;
	self.connection = mongoose.createConnection(this.dbUri);
	require('./routes/routes.js').mount(app, require('./models/models.js').mount(self.connection));
};

module.exports = Infantry;