/// <reference path="util.ts" />

module robotcode {
	export interface WorldValue {
		states: any;
		grid: string[];
		robot: {
			x: number;
			y: number
		};
		actions: string[];
	}

	export interface ActionExecution {
		(context:Context, callback:()=>void):void
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

	export class ActionDefinition {
		constructor(public name:string, public description:string, public container = false){}
	};

	export class ActionInstance {
		executing:boolean = false;
		container:ActionContainer;
		constructor(public action:ActionDefinition){}
	};

	export class ActionContainer {
		actions:ActionInstance[] = [];
	};

	export class Control {
		playing:boolean;
	};

	export class AvailableActions {
		constructor(public actions:ActionDefinition[]){}
	};

	export class Context {
		private map:{[key:string]:any} = {};
		parent:Context;
		redo:boolean;
		executeChildren:boolean;
		index:number;
		container:ActionContainer;
		instance:ActionInstance;
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


	export var actions:{[key:string]:ActionDefinition} = {};

	export var mapActions:{[key:string]:(context:Context, callback:()=>void)=>void} = {};

	export function createAction() {

	}

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

	function createActionInstance(action:ActionDefinition) {
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
			this.control = new Control();
			this.load();
			this.initContext();
		}

		load() {
			this.scriptContainer = (localStorage && JSON.parse(localStorage.getItem("script"))) || new ActionContainer();
		}

		save() {
			localStorage.setItem("script", JSON.stringify(this.scriptContainer));
		}

		initContext() {
			var context = new Context();
			context.set("world", world);
			context.container = this.scriptContainer;
			context.index = -1;
			context.executeChildren = false;
			context.redo = false;
			this.context = context;
		}

		create(action:ActionDefinition) {
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
				var executeChildren:boolean = this.context.executeChildren;
				if (executeChildren) {
					this.enterContainer(this.currentActionInstance.container);
				}
				var redo:boolean = this.context.redo;
				var index:number = this.context.index;
				var container:ActionContainer = this.context.container;
				if (!redo) {
					index++;
					this.context.index = index;
				}
				if (index >= 0 && index < container.actions.length) {
					if (this.currentActionInstance) this.currentActionInstance.executing = false;
					this.currentActionInstance = container.actions[index];
					this.currentActionInstance.executing = true;
					this.context.instance = this.currentActionInstance;
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
			context.index = -1;
			context.container = container;
			context.executeChildren = false;
			context.redo = false;
			context.parent = this.context;
			this.context = context;
		}

		private exitContainer() {
			if (this.context.parent) {
				this.context = this.context.parent;
				this.context.executeChildren = false;
			}
		}

	};

	

}