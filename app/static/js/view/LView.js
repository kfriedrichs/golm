/**
 * File: LView
 * Contains the <LogView> class.
 * The file was named LView instead of LogView because some Browsers / AdBlockers
 * would block loading the script.
 */

$(document).ready(function () {
	/**
	 * Class: LogView
	 * Logger class. Relies on events exchanged between a client and server.
	 * Starts logging as soon as the client receives the first state.
	 */
	this.LogView = class LogView {
		/**
		 * Func: Constructor
		 * Initializes listeners to socket and document events.
		 *
		 * Params:
		 * modelSocket - Socket io connection to the server
		 * logFullState - set true to save the full state at every change,
		 *	false to only log the update
		 */
		constructor(modelSocket, logFullState=true) {
			this.socket = modelSocket;

			this.data = {"log": new Array()};
			this.logFullState = logFullState;
			this.startTime;
			// if used, only log updates for this gripper
			this.grId;
			// only used if logFullState is true
			this.currentObjs = new Object();
			this.currentGrippers = new Object();
			this.currentConfig = new Object();
			// start listening to events
			this._initEventListeners();
		}
		
		// Initialize listeners to socket and document events
		_initEventListeners() {
			// register socket event listeners
			this._initSocketEvents();
			// register document event listeners
			document.addEventListener("logSegment", e => {
				if (e.detail["segmentTitle"] != undefined && e.detail["segmentTitle"] != null) {
					this.addSegment(e.detail["segmentTitle"].toString(), e.detail["additionalData"]);
				} else {
					console.log("Error: No segment title sent with logSegment event");
				}
			});
			document.addEventListener("emitMessage", e => {
				// append the message as a regular event to the log
				let timeOffset;
				if (!this.startTime) {
					timeOffset = -1;
				} else {
					timeOffset = Date.now() - this.startTime;
				}
				this._addSnapshot(timeOffset, e.detail);
			})
		}

		/**
		 * Start listening to events emitted by the model socket. After this 
		 * initialization, the view logs the client-server communication.
		 */
		_initSocketEvents() {
			this.socket.on("attach_gripper", (assignedId) => {
				this.grId = assignedId;
			});
			this.socket.on("update_state", (state) => {
				// Assumes the logging starts at first 'update_state' event.
				let timeOffset;
				if (!this.startTime) {
					// don't start logging if an empty state was sent
					if (Object.keys(state["objs"]).length == 0 && 
						Object.keys(state["grippers"]).length == 0) {
						return;
					}
					this.startTime = Date.now();
					timeOffset = 0;
				} else {
					timeOffset = Date.now() - this.startTime;
				}
				if (this.logFullState) {
					this.currentObjs = state["objs"];
					this.currentGrippers = state["grippers"];
					this._addSnapshot(timeOffset, this._getFullState());
				}
			})
			this.socket.on("update_grippers", (grippers) => {
				if (this.startTime) {
					let timeOffset = Date.now() - this.startTime;
					if (this.logFullState) {
						this.currentGrippers = grippers;
						this._addSnapshot(timeOffset, this._getFullState());
					} else {
						// reduce the log size if a gripper id is given
						if (this.grId && grippers[this.grId]) {
							if (grippers[this.grId].gripped) {
								// log the id of the gripped object
								this._addSnapshot(timeOffset, {"gripper": {
									"gripped": Object.keys(grippers[this.grId].gripped)[0]}});
							} else {
								this._addSnapshot(timeOffset, {"gripper": {
									"x": grippers[this.grId]["x"],
									"y": grippers[this.grId]["y"]
								}});
							}
						} else {
							this._addSnapshot(timeOffset, {"gripper": grippers});
						}
					}
				}
				
			});
			this.socket.on("update_objs", (objs) => {
				if (this.startTime) {
					let timeOffset = Date.now() - this.startTime;
					if (this.logFullState) {
						this.currentObjs = objs;
						this._addSnapshot(timeOffset, this._getFullState());
					}
				}
			});
			this.socket.on("update_config", (config) => {
				if (this.startTime) {
					let timeOffset = Date.now() - this.startTime;
					if (this.logFullState) {
						this.currentConfig = config;
						this._addSnapshot(timeOffset, this._getFullState());
					} else {
						this._addSnapshot(timeOffset, {"config": config});
					}
				} else if (this.logFullState) {
					// save the config for later in case it arrived before the first state
					this.currentConfig = config;
				} else {
					// save the config once in the beginning in case it arrived before the first state
					this._addSnapshot(-1, {"config": config});
				}
			});
		}

		// --- add, change, delete data --- // 

		/**
		 * Func: addSegment
		 * Make a cut and store the data logged so far (or since the last segment) as a 
		 * segment with key _segmentTitle_. Optionally add some extra info to the segment.
		 *
		 * Params:
		 * segmentTitle - key to store the logged data with, 'log' is reserved
		 * additionalData - optional data object to store with the new segment
		 */
		addSegment(segmentTitle, additionalData=null) {
			if (segmentTitle == "log") {
				// 'log' key is reserved for the collected event data
				console.log("Error at LogView.createSegment(): 'log' is reserved, use another segment name");
			} else {
				this.data[segmentTitle] = {"log": this.data["log"]};
				if (additionalData) {
					Object.entries(additionalData).forEach(([key, value]) => {
						if (key != "log") {
							this.data[segmentTitle][key] = value;
						} else {
							console.log("Skipping key 'log' of additional data in LogView.addSegment()");
						}
					});
				}
				this.clearLog();
			}
		}

		/**
		 * Func: addData
		 * Add additional data to the current log. Will be saved at 
		 * the top-level of the log object.
		 *
		 * Params:
		 * key - _str_, identifier for _data_, 'log' is reserved
		 * data - data to save, can be any json-friendly format, e.g. object, array, _str_
		 */
		addData(key, data) {
			if (key == "log") {
				// 'log' key is reserved for the collected event data
				console.log("Error at LogView.addData(): Cannot manually add data with reserved key 'log'.");
			} else {
				this.data[key] = data;
			}
		}

		/**
		 * Func: addDataToSegment
		 * Save additional data to an already created segment.
		 *
		 * Params:
		 * segment - name of an existing segment to save the _data_ to
		 * key - string, identifier for _data_, 'log' is reserved
		 * data - data to save, can be any json-friendly format, e.g. object, array, _str_
		 */
		addDataToSegment(segment, key, data) {
			if (!this.data[segment]) {
				console.log(`Error at LogView.addDataToSegment(): segment ${segment} does not exist.`);
			} else if (key == "log") {
				// 'log' key is reserved for the collected event data
				console.log("Error at LogView.addDataToSegment(): Cannot manually add data with reserved key 'log'.");
			} else {
				this.data[segment][key] = data;
			}
		}

		/**
		 * Func: clearLog
		 * Delete the current log and reset the saved state except for the configuration.
		 */
		clearLog() {
			this.data["log"] = new Array();
			this.startTime = undefined;
			this.currentObjs = new Object();
			this.currentGrippers = new Object();
		}

		// --- save data --- // 

		/**
		 * Func: sendData
		 * Save the data on the server. Logs success message to the console.
		 *
		 * Params:
		 * endpoint - GOLMI route to POST the collected data to
		 *
		 * Returns:
		 * true at success
		 */
		sendData(endpoint="/save_log") {
			fetch(new Request(endpoint, {
				method:"POST", 
				headers: { "Content-Type": "application/json;charset=utf-8" },
				body:JSON.stringify(this.data)}))
			.then(response => {
				if (!response.ok) {
					console.log("Error saving log data!");
					return true;
				} else {
					console.log("Saved log data to the server.");
					return false;
				}
			});
		}

		// --- helper functions --- //

		/**
		 * Returns:
		 * a state object containing the objects, grippers and config as received last
		 */
		_getFullState() {
			return {"objs": this.currentObjs,
					"grippers": this.currentGrippers,
					"config": this.currentConfig};
		}

		/**
		 * Add a single data update with a timestamp to the log.
		 * Params:
		 * timestamp - timestamp to associate the _data_ with,
		 *	e.g. time passed since log start
		 * data - update to save
		 */
		_addSnapshot(timestamp, data) {
			this.data["log"].push([timestamp, data]);
		}
	}; // class LogView end
}); // on document ready end
