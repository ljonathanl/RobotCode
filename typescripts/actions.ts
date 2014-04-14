/// <reference path="robotcode.ts" />
/// <reference path="../lib/tweenjs.d.ts" />

module actions {
	function setCellState(grid:robotcode.Grid, x:number, y:number, state:string) {
		var cell = grid.cells[x][y];
		if (cell) {
			cell.state = state;
		}
	}

	function getCellState(grid:robotcode.Grid, x:number, y:number) {
		var result = null;
		var cell = grid.cells[x][y];
		if (cell) {
			result = cell.state;
		}
		return result;
	}

	function canMove(grid:robotcode.Grid, x:number, y:number):boolean {
		if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
			return grid.cells[x][y].state != "hole";
		}
		return false;
	}

	var rotate = (robot:robotcode.Robot, angle:number, callback:()=>void):void => {
		if (robot.angle == angle || robot.angle == angle - 360) {
			callback();
		} else {
			if (Math.abs(robot.angle - angle) > Math.abs(robot.angle - (angle - 360))) {
				angle = angle - 360;
			}
			createjs.Tween.get(robot).to({angle:angle},500).call(callback);
		}
	};

	var move = function (offsetX:number, offsetY:number, angle:number) {
		return (context:robotcode.Context, callback:()=>void) => {
			var world = <robotcode.World> context.get("world");
			var robot = world.robot;
			var grid = world.grid;
			rotate(robot, angle, () => {
				if (!canMove(grid, robot.x + offsetX, robot.y + offsetY)) {
					createjs.Tween.get(robot).to({x:robot.x + offsetX * 0.2, y:robot.y + offsetY * 0.2}, 300).to({x:robot.x, y:robot.y}, 300).call(callback);
				} else {
					createjs.Tween.get(robot).to({x:robot.x + offsetX, y:robot.y + offsetY}, 1000).call(callback);
				}
			});
		}	
	};

	var state = function (state:string) {
		return (context:robotcode.Context, callback:()=>void) => {
			var world = <robotcode.World> context.get("world");
			var robot = world.robot;
			var grid = world.grid;
			setCellState(grid, robot.x, robot.y, state);
			setTimeout(callback, 500);
		}
	};

	var repeat = function(count:number) {
		return function(context:robotcode.Context, callback:()=>void) {
			var repeatTime:number = context.get("repeatTime");
			if (isNaN(repeatTime)) {
				repeatTime = 0;
			}
			console.log("repeatTime: " + repeatTime);
			var canContinue = repeatTime < count
			if (canContinue) {
				repeatTime++;
				context.set("repeatTime", repeatTime);
			} else {
				context.set("repeatTime", null);
			}
			context.executeChildren = canContinue;
			context.redo = canContinue;

			setTimeout(callback, 500);
		}
	}

	var ifState = function (state:string) {
		return (context:robotcode.Context, callback:()=>void) => {
			var world = <robotcode.World> context.get("world");
			var robot = world.robot;
			var grid = world.grid;
			var cellState = getCellState(grid, robot.x, robot.y);
			context.executeChildren = state == cellState;

			setTimeout(callback, 500);
		}
	}

	export var up = new robotcode.ActionDefinition("up", "move up");
	export var down = new robotcode.ActionDefinition("down", "move down");
	export var left = new robotcode.ActionDefinition("left", "move left");
	export var right = new robotcode.ActionDefinition("right", "move right");
	export var stateColor1 = new robotcode.ActionDefinition("stateColor1", "state tile in color1");
	export var stateColor2 = new robotcode.ActionDefinition("stateColor2", "state tile in color2");
	export var repeat2Times = new robotcode.ActionDefinition("repeat2Times", "repeat 2 times", true);
	export var repeat3Times = new robotcode.ActionDefinition("repeat3Times", "repeat 3 times", true);
	export var repeat4Times = new robotcode.ActionDefinition("repeat4Times", "repeat 4 times", true);
	export var ifColor1 = new robotcode.ActionDefinition("ifColor1", "if the state of the tile is red", true);
	export var ifColor2 = new robotcode.ActionDefinition("ifColor2", "if the state of the tile is green", true);

	robotcode.mapActions[up.name] = move(0, -1, 180);
	robotcode.mapActions[down.name] = move(0, 1, 0);
	robotcode.mapActions[left.name] = move(-1, 0, 90);
	robotcode.mapActions[right.name] = move(1, 0, -90);
	robotcode.mapActions[stateColor1.name] = state("color1");
	robotcode.mapActions[stateColor2.name] = state("color2");
	robotcode.mapActions[repeat2Times.name] = repeat(2);
	robotcode.mapActions[repeat3Times.name] = repeat(3);
	robotcode.mapActions[repeat4Times.name] = repeat(4);
	robotcode.mapActions[ifColor1.name] = ifState("color1");
	robotcode.mapActions[ifColor2.name] = ifState("color2");
}