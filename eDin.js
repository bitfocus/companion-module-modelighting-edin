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
						type: 'number',
						label: 'Number',
						id: 'scene',
						default: 1,
						min: 0,
						max: 9999
					}
				]
			},
			'loadSceneAdv': {
				label: 'Load Scene Time and Level',
				options: [
					{
						type: 'number',
						label: 'Number',
						id: 'scene',
						default: 1,
						min: 0,
						max: 9999
					},
					{
						type: 'number',
						label: 'Time (ms)',
						id: 'time',
						default: 1000,
						min: 1,
						max: 9999
					},
					{
						type: 'number',
						label: 'Level (%)',
						id: 'level',
						default: 100,
						min: 1,
						max: 100
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
				//var scene = parseInt(opt.scene)
				var scene = opt.scene;
				cmd = 'SCENE' + scene + 'GO';
				this.log('Test Debug' + cmd);
				break;
	
			case 'loadSceneAdv':
				var scene = opt.scene;
				var time = opt.time;
				var level = opt.level;
				cmd = 'SCENE' + scene;
				if (time !== ''){
					cmd = cmd + 'T' + time;
				}
				if (level !== ''){
					cmd = cmd + 'L' + level;
				}
				cmd = cmd + 'GO';
				break;
		}
	
		if (cmd !== undefined) {
	
			this.debug('sending tcp ', cmd, ' to', this.config.host);
	
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
				value: 'Module to Control Mode Lighting eDin NPU'
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

			//this.socket.on('data', (data) => this.debug("I GOT: " + data));

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