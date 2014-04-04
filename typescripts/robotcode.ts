/// <reference path="util.ts" />

module robotcode {
	export interface WorldValue {
		states: any;
		grid: string[];
		robot: {
			x: number;
			y: number
		}
	}

	export class Cell {
		public state:string;
	};

	export class Grid {
		cells:Cell[][];
		width:number;
		height:number;
	};

	export class Robot {
		angle = 0;
		constructor(public x:number, public y:number) {}
	};

	export class World {
		constructor(public robot:Robot, public grid:Grid){}
	};

	export class Action {
		constructor(public name:string, public description:string, public container = false){}
	};

	export class ActionInstance {
		executing:boolean = false;
		container:ActionContainer;
		constructor(public action:Action){}
	};

	export class ActionContainer {
		actions:ActionInstance[] = [];
	};

	export class Control {
		playing:boolean;
	};

	export class AvailableActions {
		constructor(public actions:Action[]){}
	};

	export class Context {
		private map:{[key:string]:any} = {};
		parent:Context;
		set(key:string, value:any) {
			this.map[key] = value;
		}
		get(key:string):any {
			var map = this.map;
			var parent = this.parent;
			while(!(key in map) && parent) {
				map = parent.map;
				parent = parent.parent;
			}
			return map[key];
		}
	}	

	export var mapActions:{[key:string]:(context:Context, callback:()=>void)=>void} = {};

	export function createWorld(worldValue:WorldValue):World {
		var grid = new Grid();
		grid.width = worldValue.grid[0].length;
		grid.height = worldValue.grid.length;

		var cells:Cell[][] = [];
		for (var i = 0; i < grid.width; ++i) {
			cells[i] = [];
			for (var j = 0; j < grid.height; ++j) {
				var cell = new Cell();
				cell.state = worldValue.states[worldValue.grid[j][i]];
				cells[i][j] = cell;
			}
		}		
		grid.cells = cells;
		
		var robot = new Robot(worldValue.robot.x, worldValue.robot.y);

		return new World(robot, grid);
	}

	function createActionInstance(action:Action) {
		var actionInstance = new ActionInstance(action);
		if (action.container) {
			actionInstance.container = new ActionContainer();
		}
		return actionInstance;
	}

	export class Script {
		currentIndex:number = 0;
		currentActionInstance:ActionInstance;
		isPaused:boolean = true;
		control:Control;
		context:Context;
		scriptContainer:ActionContainer = new ActionContainer();
		currentContainer:ActionContainer = this.scriptContainer;
		constructor(world:World) {
			this.initContext();
			this.control = new Control();
			this.load();
		}

		load() {
			this.scriptContainer = JSON.parse(localStorage.getItem("script")) || new ActionContainer();
		}

		save() {
			localStorage.setItem("script", JSON.stringify(this.scriptContainer));
		}

		initContext() {
			var context = new Context();
			context.set("world", world);
			context.set("container", this.scriptContainer);
			context.set("index", -1);
			this.context = context;
		}

		create(action:Action) {
			var actionInstance = createActionInstance(action);
			this.scriptContainer.actions.push(actionInstance);
			this.save();
		}

		add(container:ActionInstance[], item:ActionInstance, newIndex:number) {
			container.splice(newIndex, 0, item);
			this.save();
		}
		remove(container:ActionInstance[], item:ActionInstance) {
			var lastIndex = container.indexOf(item);
			container.splice(lastIndex, 1);
			this.save();
		}
		move(container:ActionInstance[], item:ActionInstance, newIndex:number) {
			var lastIndex = container.indexOf(item);
			container.splice(lastIndex, 1);
			container.splice(newIndex, 0, item);
			this.save();
		}

		play() {
			this.isPaused = false;
			this.control.playing = true;
			this.next();
			return this;
		}
		pause() {
			this.isPaused = true;
			this.control.playing = false;
			return this;
		}
		stop() {
			this.initContext();
			if (this.currentActionInstance) {
				this.currentActionInstance.executing = false;
				this.currentActionInstance = null;
			}
			return this.pause();
		}
		clear() {
			this.stop();
			this.scriptContainer.actions.splice(0, this.scriptContainer.actions.length);
			this.save();
			return this;
		}
		private next = () => {
			if (!this.isPaused) {
				var executeChildren:boolean = this.context.get("executeChildren");
				if (executeChildren) {
					this.enterContainer(this.currentActionInstance.container);
				}
				var redo:boolean = this.context.get("redo");
				var index:number = this.context.get("index");
				var container:ActionContainer = this.context.get("container");
				if (!redo) {
					index++;
					this.context.set("index", index);
				}
				if (index >= 0 && index < container.actions.length) {
					if (this.currentActionInstance) this.currentActionInstance.executing = false;
					this.currentActionInstance = container.actions[index];
					this.currentActionInstance.executing = true;
					this.context.set("instance", this.currentActionInstance);
					mapActions[this.currentActionInstance.action.name](
						this.context, 
						this.next);
				} else {
					if (this.context.parent) {
						this.exitContainer();
						this.next();
					} else {
						this.stop();
					}
				}
			}
		}
		private enterContainer(container:ActionContainer) {
			var context = new Context();
			context.set("index", -1);
			context.set("container", container);
			context.set("executeChildren", false);
			context.set("redo", false);
			context.parent = this.context;
			this.context = context;
		}

		private exitContainer() {
			if (this.context.parent) {
				this.context = this.context.parent;
				this.context.set("executeChildren", false);
			}
		}

	};

	

}