/// <reference path="robotcode.ts" />
/// <reference path="actions.ts" />
/// <reference path="util.ts" />

declare var Vue:any;
declare var Sortable:any;
var worldValue = {
	states: 
	{ 
		"H": "hole",
		"N": "none",
		"1": "color1",
		"2": "color2",
	},
	grid:
	[
		"NNNNNHHHNNNNN",
		"1HNN11NNNNNNN",
		"NNNNNHNNNNNHH",
		"NNNNNNNNNHNNN",
		"NNNHNNNNNNNHN",
		"N21NNNNNNHNHN",
		"NNNNN2NNNN22N",
	],
	robot: {
		x: 4,
		y: 4
	}
}

var range = function(begin:number, end:number) {
	var offset = begin > end ? end : begin;
    var delta = Math.abs(end - begin);

    var result = [];
    for (var i = 0; i < delta; i++) {
        result.push(i + offset);
    }
    return result;
}

var degToRad = Math.PI / 180;
var toPosition = function(angle:number, offset:number) {
	var x,y = 0;
	var angleRad = angle * degToRad;
	x = Math.round(offset * Math.cos(angleRad));
	y = Math.round(offset * Math.sin(angleRad));
	
    return x + "px " + y + "px";
}

var world = robotcode.createWorld(worldValue);
var grid = world.grid;
var robot = world.robot;

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
		actions.ifColor2,
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
	data: robot,
	methods: {
		toPosition: toPosition
	}
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
	methods: {
		clear: ()=>{
			script.clear();
		}
	}
});

var scriptView = new Vue({
	el: ".script",
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

