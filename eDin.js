var TelnetSocket = require('../../telnet');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);
    self.status(self.STATUS_WARNING, 'Initializing');
	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function (config) {
	var self = this;
	self.config = config;
	self.init_tcp();
};

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATE_UNKNOWN);

	self.init_tcp();
};

instance.prototype.init_tcp = function () {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.host) {
		if (self.config.port === undefined) {
			self.config.port = 22;
		}
		self.socket = new TelnetSocket(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error', "Network error: " + err.message);
		});

		self.socket.on('connect', function () {
			self.status(self.STATE_OK);
			debug("Connected");
		});

		self.socket.on('data', function (data) { });
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'I have no clue what to put here'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'NPU IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Command Port',
			width: 6,
			default: "22",
			regex: self.REGEX_NUMBER
		}
	];
};

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug("destroy", self.id);
};


instance.prototype.actions = function (system) {
	var self = this;
	self.system.emit('instance_actions', self.id, {

		'loadScene': {
			label: 'Load Scene',
			options: [
				{
					type: 'textinput',
					label: 'Number',
					id: 'scene',
					default: '1',
					regex: self.REGEX_NUMBER
				}
			]
		},
		'loadSceneAdv': {
			label: 'Load Scene Time and Level',
			options: [
				{
					type: 'textinput',
					label: 'Number',
					id: 'scene',
					default: '1',
					regex: self.REGEX_NUMBER
				},
				{
					type: 'textinput',
					label: 'Time (ms)',
					id: 'time',
					default: '1000',
					regex: self.REGEX_NUMBER
				},
				{
					type: 'textinput',
					label: 'Level (%)',
					id: 'level',
					default: '100',
					regex: self.REGEX_NUMBER
				}
			]
		},
	});
};

instance.prototype.action = function (action) {
	var self = this;
	var opt = action.options;

	// parseInt(action.options.int)
	var cmd;

	switch (action.action) {
		
		case 'loadScene':
			var scene = parseInt(opt.scene)
			cmd = 'SCENE' + scene + 'GO';
			self.log('Test Debug' + cmd);
			break;

		case 'loadSceneAdv':
			var scene = parseInt(opt.scene);
			var time = parseInt(opt.time);
			var level = parseInt(opt.level);
			cmd = 'SCENE' + scene;
			if (time !== ''){
				cmd = cmd + 'T' + time;
			}
			if (level !== ''){
				cmd = cmd + 'L' + level;
			}
			cmd = cmd + 'GO';
			self.log('Test Debug' + cmd);
			break;
	}

	if (cmd !== undefined) {

		debug('sending tcp', cmd, "to", self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.write(cmd+"\r\n");
		}
		else {
			debug('Socket not connected :(');
		}

	}

	debug('action():', action);

};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
