$(document).ready(function () {
	
	/**
	 * Local controller. Can connect to one or more models. In each model, a gripper is created
	 * at connection. If a gripperId is passed, an existing gripper with this id is assigned.
	 * Otherwise a new gripper is added with the given id or alternatively the session id. 
	 * The user's keystrokes are used to control the assigned gripper(s) and any gripped object.
	 * @param {optional Array of [socket, gripperId], where gripperId can be null, default:null} modelSockets
	 */
	this.LocalKeyController = class LocalKeyController {
		constructor(modelSockets=null) {
			// array of model socket-gripperId pairs that are controlled
			this.models = modelSockets ? modelSockets : new Array();
			
			// assign functions to key codes: [function for keydown, function for keyup, down?] 
			// grip and flip are one-time actions, move and rotate are looped
			this.keyAssignment = {
				13: [this.grip, null, false],					// Enter
				32: [this.grip, null, false],					// Space
				// hack as long as loops are not fixed for sockeio server
				37: [this.moveLeft, null, false],		// arrow left
				38: [this.moveUp, null, false],		// arrow up
				39: [this.moveRight, null, false],		// arrow right
				40: [this.moveDown, null, false],		// arrow down
				// 37: [this.moveLeft, this.stopMove, false],		// arrow left
				// 38: [this.moveUp, this.stopMove, false],		// arrow up
				// 39: [this.moveRight, this.stopMove, false],		// arrow right
				// 40: [this.moveDown, this.stopMove, false],		// arrow down
				65: [this.rotateLeft, null, false],	// a
				68: [this.rotateRight, null, false],	// d
				83: [this.flip, null, false],					// s
				87: [this.flip, null, false]					// w
			};

			// Stores codes of pressed keys waiting for key release
			this.activeKeys = new Set();

			// Set up key listeners
			this._initKeyListener();
		}

		// --- (Un)Subscribing models ---

		/**
		 * Subscribe a new model. Duplicate subscription is prevented.
		 * If no gripper with the given id exists, it will be added. If no id was
		 * passed, the session id of the socket is used.
		 * @param {socket of the model server to notify} socket
		 * @param {optional: id of the gripper to control, default: null} grId
		 */
		attachModel(socket, grId=null) {
			// make sure not to subscribe a model-gripper pair twice
			for (let [s, g] of this.models) {
				if (s.id == socket.id && g == grId) { return; }
			}
			// register the gripper at the model
			socket.emit("add_gripper", grId);
			// use the id authoratively assigned by the model
			socket.on("attach_gripper", (assignedId) => {
				this.models.push([socket, assignedId]);
			});
		}

		/**
		 * Remove a model from the internal list of models to notify. Remove the associated gripper.
		 * @param {socket of the model API to unsubscribe} socket
		 * @param {id of the gripper to unsubscribe, optional. If null, all grippers of the model url will be unsubscribed} grId
		 * 
		 */
		detachModel(socket, grId=null) {
			if (grId) {
				// only remove pairs [socket, gripperId]
				for (let i = 0; i < this.models.length; i++) {
					if (this.models[i][0].id == socket.id && this.models[i][2] == grId) {
						this.models[i][0].emit("remove_gripper", grId);
						this.models.splice(i, 1); 
					}
				}
			} else {
				// remove any occurence of the socket
				for (let i = 0; i < this.models.length; i++) {
					if (this.models[i][0].id == socket.id) {
						this.models[i][0].emit("remove_gripper", this.models[i][1]);
						this.models.splice(i, 1); 
					}
				}
			}
		}

		// --- Notifying subscribed models ---

		/**
		 * Notifies all subscribed models that a "grip" should be attempted.
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		grip(thisArg) {
			let loop = false;
			// send an event to each model
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("grip", {"id": grId, "loop":loop});
			});
		}

		/**
		 * Unused. Can be employed to stop a looped gripping action.
		 */
		stopGrip(thisArg) {
			// send a request to each subscribed model
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_grip", {"id":grId});	
			});
		}

		/**
		 * Notify models to move the gripper 1 unit to the left.
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		moveLeft(thisArg) { thisArg._moveGr(-1, 0); }

		/**
		 * Notify models to move the gripper 1 unit up.
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		moveUp(thisArg) { thisArg._moveGr(0, -1); }
		
		/**
		 * Notify models to move the gripper 1 unit to the right.
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		moveRight(thisArg) { thisArg._moveGr(1, 0); }

		/**
		 * Notify models to move the gripper 1 unit down.
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		moveDown(thisArg) { thisArg._moveGr(0, 1); }

		/**
		 * Helper function to notify models to move the gripper 1 block in a specified direction.
		 * @param {number of blocks to move in x direction} dx
		 * @param {number of blocks to move in y direction} dy
 		 */
		_moveGr(dx, dy) {
			let loop = false;
			this.models.forEach(([socket, grId]) => {
				socket.emit("move", {"id": grId, "dx": dx, "dy": dy, "loop": loop});
			});
		}

		stopMove(thisArg) {
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_move", {"id": grId});
			});
		}

		/**
		 * 
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		rotateLeft(thisArg) { thisArg._rotate(-1); }

		/**
		 * 
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		rotateRight(thisArg) { thisArg._rotate(1); }

		/**
		 * Helper function to notify models to rotate a gripped object in a specified direction.
		 * @param {number of units to turn. Pass negative value for leftwards rotation} direction
		 */
		_rotate(direction) {
			let loop = false;
			this.models.forEach(([socket, grId]) => {
				socket.emit("rotate", {"id":grId, "direction":direction, "loop":loop});
			});
		}

		stopRotate(thisArg) {
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_rotate", {"id":grId});
			});
		}

		/**
		 * Notify models to flip a gripped object on a specified axis.
		 * @param {reference to LocalKeyController instance (this)} thisArg
		 */
		flip(thisArg) { 
			let loop = false;
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("flip", {"id":grId, "loop":loop});
			});
		}

		stopFlip(thisArg) {
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_flip", {"id":grId});
			});
		}

		// --- Reacting to user events ---

		/**
		 * Start fresh, delete any keys remembered as currently pressed.
		 */
		resetKeys(){
			for (let key of Object.keys(this.keyAssignment)) {
				// set property pressed to false for each key
				this.keyAssignment[key][2] = false;
			}
		}

		/**
		 * Register the key listeners to allow gripper manipulation.
		 * Notifies the associated models.
		 */
		_initKeyListener() {
			$(document).keydown( e => {
				if (this._downAssigned(e.keyCode)) {
					// only progress if the key is not already in state "down"
					if (!this._isDown(e.keyCode)) {
						// if a keyup-function is assigned, change the state to "down"
						if (this._upAssigned(e.keyCode)) {
							this.keyAssignment[e.keyCode][2] = true;
						}
						// execute the function assigned to the keydown event
						this.keyAssignment[e.keyCode][0](this);
					}
				}
			});

			$(document).keyup( e => {
				// check if a function is assigned. Only execute if the key was remembered as "down"
				if (this._upAssigned(e.keyCode) && this._isDown(e.keyCode)) {
					// execute the function assigned to the keyup event
					this.keyAssignment[e.keyCode][1](this);
					// change the state to "up"
					this.keyAssignment[e.keyCode][2] = false;
				}
			});
		}

		/** 
		 * Check whether a function is assigned to the keydown event of a given key code.
		 * @param {int, code of the key in question} keyCode
		 * @return bool, true signifying a function is assigned to keydown
		 */
		_downAssigned(keyCode) {
			return this.keyAssignment[keyCode] && this.keyAssignment[keyCode][0];
		}

		/** 
		 * Check whether a function is assigned to the keyup event of a given key code.
		 * @param {int, code of the key in question} keyCode
		 * @return bool, true signifying a function is assigned to keyup
		 */
		_upAssigned(keyCode) {
			return this.keyAssignment[keyCode] && this.keyAssignment[keyCode][1];
		}

		/**
		 * Check whether a key is currently in "down" state aka currently pressed.
		 * @return bool, true if the key is "down"
		 */
		_isDown(keyCode) {
			return this.keyAssignment[keyCode][2];
		}

	}; // class LocalKeyController end

}); // on document ready end