/**
 * File: View.js
 * Contains the <View> class.
 */

$(document).ready(function () {
	/**
	 * Class: View
	 * Abstract interface class. Separates the interface into
	 * background, objects and grippers which concrete
	 * implementations of this view might want to draw
	 * separately to improve the performance (the components
	 * are static to varying degrees).
	 * While drawing functions lack implementations,
	 * internal data structures and basic communication
	 * with the model are already sketched out in this class.
	 */
	this.View = class View {
		/**
		 * Func: Constructor
		 * Initializes socket listeners.
		 *
		 * Params:
		 * modelSocket - Socket io connection to the server
		 */
		constructor(modelSocket) {
			this.socket = modelSocket;
			this._initSocketEvents();

			// Configuration. Is assigned at startDrawing()
			this.cols;			// canvas width in blocks
			this.rows;			// canvas height in blocks

			// Current state
			this.objs = new Object();
			this.grippers = new Object();
		}

		/**
		 * Start listening to events emitted by the <Model> socket. After
		 * this initialization, the view reacts to <Model> updates.
		 */
		_initSocketEvents() {
			// new state -> redraw object and gripper layer
			this.socket.on("update_state", (state) => {
				if (state["grippers"] && state["objs"]) {
					this.grippers = state["grippers"];
					this.objs = state["objs"];
					this.redrawGr();
					this.redrawObjs();
				} else {
					console.log("Error: Received state from model does not have the right format." + 
						" Expected keys 'grippers' and 'objs'.");
				}
			});
			// new gripper state -> redraw grippers
			this.socket.on("update_grippers", (grippers) => {
				this.grippers = grippers;
				this.redrawGr();
			});
			// new object state -> redraw objects
			this.socket.on("update_objs", (objs) => {
				this.objs = objs;
				this.redrawObjs();
			});
			// new configuration -> save values and redraw everything
			this.socket.on("update_config", (config) => {
				this._loadConfig(config);
				this.redraw();
			});
		}

		// --- getter / setter --- //
		
		// Property: canvasWidth
		// canvas width in pixels
		get canvasWidth() {
			console.log("get canvasWidth() at View: not implemented");
			return undefined;
		}

		// Property: canvasHeight
		// canvas height in pixels
		get canvasHeight() {
			console.log("get canvasHeight() at View: not implemented");
			return undefined;
		}

		// Property: blockSize
		// size of a (square) block in pixels
		get blockSize() {
			return this.canvasWidth/this.cols;
		}

		// --- drawing functions --- //

		/**
		 * Func: clear
		 * Remove any old drawings.
		 */
		clear() {
			console.log("clear() at View: not implemented");
		}

		/**
		 * Func: draw
		 * Draw background, objects, grippers.
		 */
		draw() {
			this.drawBg();
			this.drawGr();
			this.drawObjs();
		}

		/**
		 * Func: redraw
		 * Redraw everything. 
		 * In contrast to <draw>, this function assumes the game has been
		 * drawn in the past and the old drawing needs to be removed
		 * first.
		 */
		redraw() {
			this.clear();
			this.draw();
		}

		/**
		 * Func: drawBg
		 * Draw a background to the game.
		 * Stub.
		 */ 
		drawBg() {
			console.log("drawBg() at View: not implemented");
		}

		/**
		 * Func: redrawBg
		 * Redraw the background.
		 * In contrast to <drawBg>, this function assumes the
		 * background has been drawn in the past
		 * and the old drawing needs to be removed first.
		 */ 
		redrawBg() {
			console.log("redrawBg() at View: not implemented");
		}

		/**
		 * Func: drawObjs
		 * Draw the (static) objects.
		 * Stub.
		 */
		drawObjs() {
			console.log(`drawObjs() at View: not implemented`);
		}

		/**
		 * Func: redrawObjs
		 * Redraw the (static) objects.
		 * In contrast to <drawObjs>, this function assumes the
		 * objects have been drawn in the past
		 * and the old drawing needs to be removed first.
		 * Stub.
		 */
		redrawObjs() {
			console.log(`redrawObjs() at View: not implemented`);
		}

		/**
		 * Func: drawGr
		 * Draw the <Gripper> (and, depending on the
		 * implementation, the gripped <Obj> too).
		 */
		drawGr() {
			console.log("drawGr() at View: not implemented");
		}

		/**
		 * Func: redrawGr
		 * Draw the <Gripper> (and, depending on the
		 * implementation, the gripped <Obj> too).
		 * In contrast to <drawGr>, this function assumes
		 * the gripper has been drawn in the past
		 * and the old drawing needs to be removed first.
		 */
		redrawGr() {
			console.log("redrawGr() at View: not implemented");
		}

		/**
		 * Loads a configuration received from the <Model>.
		 * The values are saved since the <Config> is
		 * not expected to change frequently. 
		 * If no configuration is passed, it is requested from the model.
		 * Implemented as an async function to make sure the
		 * configuration is complete before subsequent steps
		 * (i.e. drawing) are made.
		 * Params:
		 * config - <Config>, obtained from the <Model>
		 */
		_loadConfig(config) {
			// Save all relevant values
			this.cols = config.width;
			this.rows = config.height;
		}

	}; // class View end
}); // on document ready end
