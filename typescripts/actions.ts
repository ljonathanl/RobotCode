/// <reference path="robotcode.ts" />
/// <reference path="../lib/tweenjs.d.ts" />

module actions {
	function setCellColor(grid:robotcode.Grid, x:number, y:number, color:string) {
		var cell = grid.cells[x][y];
		if (cell) {
			cell.color = color;
		}
	}

	function canMove(grid:robotcode.Grid, x:number, y:number):boolean {
		if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
			return grid.cells[x][y].color != "#000000";
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

	var color = function (color:string) {
		return (context:robotcode.Context, callback:()=>void) => {
			var world = <robotcode.World> context.get("world");
			var robot = world.robot;
			var grid = world.grid;
			setCellColor(grid, robot.x, robot.y, color);
			setTimeout(callback, 500);
		}
	};

	var repeat = function(context:robotcode.Context, callback:()=>void) {
		var index = <number> context.get("index");
		if (isNaN(index)) {
			index = 0;
		}
		console.log("index: " + index);
		var canContinue = index < 3
		if (canContinue) {
			index++;
			context.set("index", index);
		} else {
			context.set("index", null);
		}

		setTimeout(callback, 500, canContinue);
	}

	export var up = new robotcode.Action("up", "move up");
	export var down = new robotcode.Action("down", "move down");
	export var left = new robotcode.Action("left", "move left");
	export var right = new robotcode.Action("right", "move right");
	export var colorRed = new robotcode.Action("colorRed", "color tile in red");
	export var colorGreen = new robotcode.Action("colorGreen", "color tile in green");
	export var repeat3Times = new robotcode.Action("repeat3Times", "repeat 3 times", true);

	robotcode.mapActions[up.name] = move(0, -1, -90);
	robotcode.mapActions[down.name] = move(0, 1, 90);
	robotcode.mapActions[left.name] = move(-1, 0, 180);
	robotcode.mapActions[right.name] = move(1, 0, 0);
	robotcode.mapActions[colorRed.name] = color("#FF0000");
	robotcode.mapActions[colorGreen.name] = color("#00FF00");
	robotcode.mapActions[repeat3Times.name] = repeat;
}