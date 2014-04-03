/// <reference path="robotcode.ts" />
/// <reference path="actions.ts" />
/// <reference path="util.ts" />

declare var Vue:any;
declare var Sortable:any;
var gridValue = {
	states: 
	{ 
		"H": "hole",
		"N": "none",
		"1": "color1",
		"2": "color2",
	},
	grid:
	[
		"NNNNNHHHNN",
		"1HNN11NNNN",
		"NNNNNHNNNN",
		"NNNNNNNNNH",
		"NNNHNNNNNN",
		"N21NNNNNNH",
		"NNNNN2NNNN",
		"NNNHHNNNNN",
		"NNNNNHNNNN",
		"NNNNNNN1NN"
	]
}

var range = function(begin:number, end:number) {
	var offset = begin > end ? end : begin;
    var delta = Math.abs(end - begin);

    var result = [];
    for (var i = 0; i < delta; i++) {
        result.push(i + offset);
    };
    return result;
}

var grid = robotcode.createGrid(gridValue);
var robot = new robotcode.Robot();
robot.x = 0;
robot.y = 0;

var world = new robotcode.World(robot, grid);
var script = new robotcode.Script(world);
var availableActions = new robotcode.AvailableActions(
	[
		actions.up, 
		actions.down,
		actions.left,
		actions.right,
		actions.stateColor1,
		actions.stateColor2,
		actions.ifColor1,
		actions.repeat3Times,
	]);

var initClasses = function(i:number, j:number):string {
	var classes:string[] = [];
	var cells = grid.cells;
	var cell:robotcode.Cell = cells[i][j];
	if (cell.state == "hole") {
		if (i - 1 >= 0 && cells[i - 1][j].state != "hole") {
			classes.push("cell-left");
		}
		if (i + 1 < grid.width && cells[i + 1][j].state != "hole") {
			classes.push("cell-right");
		}
		if (j - 1 >= 0 && cells[i][j - 1].state != "hole") {
			classes.push("cell-top");
		}
		if (j + 1 < grid.height && cells[i][j + 1].state != "hole") {
			classes.push("cell-bottom");
		}
	} else {
		if (i - 1 < 0 || cells[i - 1][j].state == "hole") {
			classes.push("hole-left");
		}
		if (i + 1 >= grid.width || cells[i + 1][j].state == "hole") {
			classes.push("hole-right");
		}
		if (j - 1 < 0 || cells[i][j - 1].state == "hole") {
			classes.push("hole-top");
		}
		if (j + 1 >= grid.height || cells[i][j + 1].state == "hole") {
			classes.push("hole-bottom");
		}
	}
	return classes.join(" ");
}

Vue.directive("sortable", {
	isFn: true,
	bind: function() {
		if (!this.el.sortable) {
			var vm = this.vm;
			var data = this.el.dataset;
			this.el.sortable = new Sortable(this.el, {group: data.group, handle: data.handle});
			this.el.sortable.countListeners = 0;
		}
	},
	update: function (fn) {
		var vm = this.vm;
		this.handler = function (e) {
			fn.call(vm, e);
		}
		this.el.addEventListener(this.arg, this.handler);
	},
	unbind: function() {
		this.el.removeEventListener(this.arg, this.handler);
		this.el.sortable.countListeners--;
		if (!this.el.sortable.countListeners) {	
			this.el.sortable.destroy();
			delete this.el.sortable;
		}
	}
});

Vue.component("container", {
	template: "#container-template",
	replace: true
});

Vue.component("action", {
	template: "#action-template",
	replace: true
});

var gridView = new Vue({
	el: ".grid",
	data: grid,
	methods: {
		range: range,
		initClasses: initClasses,
	}
});

var robotView = new Vue({
	el: ".robot",
	data: robot
});

var controlView = new Vue({
	el: ".controlBoard",
	data: script.control,
	methods: {
		play: ()=>{
			script.play();
		},
		pause: ()=>{
			script.pause();
		},
		clear: ()=>{
			script.clear();
		},
		stop: ()=>{
			script.stop();
		},
	}
});

var availableActionsView = new Vue({
	el: ".availableActions",
	data: availableActions,
	methods: {
		add: (action:robotcode.Action)=>{
			script.create(action);
		},
	}
});

var garbageView = new Vue({
	el: ".garbage",
	sortable: {
		group: "actions"
	}
});

var scriptView = new Vue({
	el: ".script",
	sortable: {
		group: "actions"
	},
	data: {
		actions: script.scriptContainer.actions
	},
	methods: {
		add: function(event) {
			script.add(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
		},
		update: function(event) {
			script.move(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
		},
		remove: function(event) {
			script.remove(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance);
		}
	}
});

