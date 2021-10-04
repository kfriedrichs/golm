/**
 * File: LocalKeyController.js
 * Contains the <LocalKeyController> class.
 */

$(document).ready(function () {
	
	/**
	 * Class: LocalKeyController
	 * Local controller. Can connect to one or more <Model>s.
	 * The user's keystrokes are used to control the assigned
	 * <Gripper> (s) and any gripped <Obj>.
	 */
	this.LocalKeyController = class LocalKeyController {
		/**
		 * Func: Constructor
		 * If sockets are passed, a <Gripper> is created
		 * in each model at connection. If a gripperId is passed,
		 * an existing <Gripper> with this id is assigned.
		 * Otherwise a new gripper is added with the given id or
		 * alternatively the session id.
		 * Initializes keyboard event listeners.
		 *
		 * Params:
		 * modelSockets - optional: Array of [socket, gripperId],
		 * where gripperId can be null
		 */
		constructor(modelSockets=null) {
			// array of model socket-gripperId pairs that are controlled
			this.models = modelSockets ? modelSockets : new Array();
			
			// assign functions to key codes: [function for keydown, function for keyup, down?] 
			// for now, all actions are one-time
			this.keyAssignment = {
				13: [this.grip, null, false],			// Enter
				32: [this.grip, null, false],			// Space
				37: [this.moveLeft, null, false],		// arrow left
				38: [this.moveUp, null, false],			// arrow up
				39: [this.moveRight, null, false],		// arrow right
				40: [this.moveDown, null, false],		// arrow down
				65: [this.rotateLeft, null, false],		// a
				68: [this.rotateRight, null, false],	// d
				83: [this.flip, null, false],			// s
				87: [this.flip, null, false]			// w
			};

			// Stores codes of pressed keys waiting for key release
			this.activeKeys = new Set();

			// Set up key listeners
			this._initKeyListener();
		}

		// --- (Un)Subscribing models ---

		/**
		 * Func: attachModel
		 * Subscribe a new <Model>. Duplicate subscription is prevented.
		 * If no gripper with the given id exists, it will be added.
		 * If no id was passed, the session id of the socket is used.
		 *
		 * Params:
		 * socket - socket of the model server to notify
		 * grId - optional: id of the gripper to control
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
		 * Func: detachModel
		 * Remove a model from the internal list of <Model>s to notify.
		 * Remove the associated gripper.
		 *
		 * Params:
		 * socket - socket of the model API to unsubscribe
		 * grId - id of the gripper to unsubscribe, optional. If null, all
		 * grippers of the model url will be unsubscribed
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
		 * Func: grip
		 * Notifies all subscribed <Model>s that a "grip" should
		 * be attempted.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
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
		 * Func: moveLeft
		 * Notify <Model>s to move the gripper 1 unit to the left.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		moveLeft(thisArg) { thisArg._moveGr(-1, 0); }

		/**
		 * Func: moveUp
		 * Notify <Model>s to move the gripper 1 unit up.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		moveUp(thisArg) { thisArg._moveGr(0, -1); }
		
		/**
		 * Func: moveRight
		 * Notify <Model>s to move the gripper 1 unit to the right.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		moveRight(thisArg) { thisArg._moveGr(1, 0); }

		/**
		 * Func: moveDown
		 * Notify <Model>s to move the gripper 1 unit down.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		moveDown(thisArg) { thisArg._moveGr(0, 1); }

		/**
		 * Helper function to notify <Model>s to move the gripper 1 block in a specified direction.
		 * Params:
		 * dx - number of blocks to move in x direction
		 * dy - number of blocks to move in y direction
 		 */
		_moveGr(dx, dy) {
			let loop = false;
			this.models.forEach(([socket, grId]) => {
				socket.emit("move", {"id": grId, "dx": dx, "dy": dy, "loop": loop});
			});
		}

		/**
		 * Unused. Can be employed to stop a looped moving action.
		 */
		stopMove(thisArg) {
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_move", {"id": grId});
			});
		}

		/**
		 * Func: rotateLeft
		 * Notify <Model>s to rotate a gripped <Obj> 1 unit to the left.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		rotateLeft(thisArg) { thisArg._rotate(-1); }

		/**
		 * Func: rotateRight
		 * Notify <Model>s to rotate a gripped <Obj> 1 unit to the right.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		rotateRight(thisArg) { thisArg._rotate(1); }

		/**
		 * Helper function to notify <Model>s to rotate a gripped <Obj> in a specified direction.
		 * Params:
		 * direction - number of units to turn. Pass negative value for leftwards rotation
		 */
		_rotate(direction) {
			let loop = false;
			this.models.forEach(([socket, grId]) => {
				socket.emit("rotate", {"id":grId, "direction":direction, "loop":loop});
			});
		}

		/**
		 * Unused. Can be employed to stop a looped rotating action.
		 */
		stopRotate(thisArg) {
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_rotate", {"id":grId});
			});
		}

		/**
		 * Func: flip
		 * Notify <Model>s to flip a gripped <Obj> on a specified axis.
		 *
		 * Params:
		 * thisArg - reference to this <LocalKeyController> instance
		 */
		flip(thisArg) { 
			let loop = false;
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("flip", {"id":grId, "loop":loop});
			});
		}
		
		/**
		 * Unused. Can be employed to stop a looped flipping action.
		 */
		stopFlip(thisArg) {
			thisArg.models.forEach(([socket, grId]) => {
				socket.emit("stop_flip", {"id":grId});
			});
		}

		// --- Reacting to user events ---

		/**
		 * Func: resetKeys
		 * Used if looped movements are enabled.
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
		 * Notifies the associated <Model>s.
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
		 * Check whether a function is assigned to the keydown event
		 * of a given key code.
		 * Params:
		 * keyCode - _int_, code of the key in question
		 * Returns: _bool_, true signifying a function is assigned to keydown
		 */
		_downAssigned(keyCode) {
			return this.keyAssignment[keyCode] && this.keyAssignment[keyCode][0];
		}

		/** 
		 * Check whether a function is assigned to the keyup event
		 * of a given key code.
		 * Params:
		 * keyCode - _int_, code of the key in question
		 * Returns: _bool_, true signifying a function is assigned to keyup
		 */
		_upAssigned(keyCode) {
			return this.keyAssignment[keyCode] && this.keyAssignment[keyCode][1];
		}

		/**
		 * Check whether a key is currently in "down" state aka
		 * currently pressed.
		 * Returns: _bool_, true if the key is "down"
		 */
		_isDown(keyCode) {
			return this.keyAssignment[keyCode][2];
		}

	}; // class LocalKeyController end
}); // on document ready end
