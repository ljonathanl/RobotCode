/// <reference path="robotcode.ts" />
/// <reference path="actions.ts" />
/// <reference path="util.ts" />

declare var Vue:any;
declare var Sortable:any;
var gridValue = {
	colors: 
	{ 
		"B": "#000000",
		"W": "#CCCCCC",
	},
	grid:
	[
		"WWWWWBBBWW",
		"WBWWWWWWWW",
		"WWWWWBWWWW",
		"WWWWWWWWWB",
		"WWWBWWWWWW",
		"WWWWWWWWWB",
		"WWWWWWWWWW",
		"WWWBBWWWWW",
		"WWWWWBWWWW",
		"WWWWWWWWWW"
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

var world = new robotcode.World(robot, grid);
var script = new robotcode.Script(world);
var availableActions = new robotcode.AvailableActions(
	[actions.up, actions.down, actions.left, actions.right, actions.colorRed, actions.colorGreen, actions.repeat3Times]);

Vue.directive("sortable", {
	isFn: true,
	bind: function() {
		if (!this.el.sortable) {
			var vm = this.vm;
			this.el.sortable = new Sortable(this.el, {group: this.el.dataset.group});
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


var gridView = new Vue({
	el: ".grid",
	data: grid,
	methods: {
		range: range
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
			script.add(action);
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
		update: function(event) {
			script.move(event.element.vue_vm.$data.actionInstance, event.index);
		},
		remove: function(event) {
			script.remove(event.element.vue_vm.$data.actionInstance);
		}
	}
});

