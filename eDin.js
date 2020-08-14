var tcp = require('../../telnet');
var instance_skel = require('../../instance_skel');

var debug;
var log;

class instance extends instance_skel {

	constructor(system, id, config) {
		super(system, id, config);

		this.actions();
	}

	actions(system) {

		this.setActions({
			'loadScene': {
				label: 'Load Scene',
				options: [
					{
						type: 'textinput',
						label: 'Number',
						id: 'scene',
						default: '1',
						regex: this.REGEX_NUMBER
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
						regex: this.REGEX_NUMBER
					},
					{
						type: 'textinput',
						label: 'Time (ms)',
						id: 'time',
						default: 1000,
						regex: this.REGEX_NUMBER
					},
					{
						type: 'textinput',
						label: 'Level (%)',
						id: 'level',
						default: 100,
						regex: this.REGEX_PERCENT
					}
				]
			}
		});
	}

	action(action) {
		
		let opt = action.options;
		var cmd;

		switch (action.action) {
		
			case 'loadScene':
				var scene = parseInt(opt.scene)
				cmd = 'SCENE' + scene + 'GO';
				this.log('Test Debug' + cmd);
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
				this.debug('Test Debug' + cmd);
				break;
		}
	
		if (cmd !== undefined) {
	
			this.debug('sending tcp', cmd, "to", this.config.host);
	
			if (this.socket !== undefined && this.socket.connected) {
				this.socket.write(cmd);
			}
			else {
				this.debug('Socket not connected :(');
			}
	
		}
	}

	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'Module to Control Mode Lighting eDin NPU running firmware version 1.x.x'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'NPU IP',
				width: 6,
				regex: this.REGEX_IP
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Command Port',
				width: 6,
				default: '22',
				regex: this.REGEX_PORT

			}
		];
	}

	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy();
		}
		this.debug('DESTROY', this.id);
	}

	init() {
		debug = this.debug;
		log = this.log;

		this.initTCP();
	}

	initTCP() {
		if (this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;
		}

		if (this.config.port === undefined){
			this.config.port = 22;
		}

		if (this.config.host) {
			this.status(this.STATUS_WARNING, 'Connecting');
			this.socket = new tcp(this.config.host, this.config.port);

			this.socket.on('status_change', (status, message) => {
				this.status(status, message);
			});

			this.socket.on('error', (err) => {
				this.debug("Network error", err);
				this.status(this.STATUS_ERROR, err);
				this.log('error', "Network error: " + err.message);
			});

			this.socket.on('connect', () => {
				this.debug("Connected");
				this.status(this.STATUS_OK);
				this.log("Connection Established");
			});

			this.socket.on('data', (data) => this.debug("I GOT: " + data));

		}
	}

	//On Config changes apply new config
	updateConfig(config) {
		var resetConnection = false;

		if (this.config != config) {
			resetConnection = true;
		}

		this.config = config;

		if (resetConnection === true || this.socket === undefined) {
			this.initTCP();
		}
	}
}


exports = module.exports = instance;