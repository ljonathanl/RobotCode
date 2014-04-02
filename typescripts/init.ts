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
		"NHNN11NNNN",
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

var add = function<T>(container:T[], item:T, newIndex:number) {
	container.splice(newIndex, 0, item);
}
var remove = function<T>(container:T[], item:T) {
	var lastIndex = container.indexOf(item);
	container.splice(lastIndex, 1);
}
var move = function<T>(container:T[], item:T, newIndex:number) {
	remove(container, item);
	add(container, item, newIndex);
}

var grid = robotcode.createGrid(gridValue);
var robot = new robotcode.Robot();

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
		add: function(event) {
			add(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
		},
		update: function(event) {
			move(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
		},
		remove: function(event) {
			remove(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance);
		}
	}
});

