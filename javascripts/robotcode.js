var DomUtil;
(function (DomUtil) {
    function before(element, insert) {
        if (element.parentNode) {
            element.parentNode.insertBefore(insert, element);
        }
    }
    DomUtil.before = before;

    function after(element, insert) {
        if (element.parentNode) {
            element.parentNode.insertBefore(insert, element.nextSibling);
        }
    }
    DomUtil.after = after;

    function index(element) {
        for (var k = 0, e = element; e = e.previousElementSibling; ++k)
            ;
        return k;
    }
    DomUtil.index = index;

    var Statuses;
    (function (Statuses) {
        Statuses[Statuses["off"] = 0] = "off";
        Statuses[Statuses["start"] = 1] = "start";
        Statuses[Statuses["enter"] = 2] = "enter";
    })(Statuses || (Statuses = {}));
    ;

    var DnDContainerBehavior = (function () {
        function DnDContainerBehavior(element, placeHolder, callback) {
            this.element = element;
            this.placeHolder = placeHolder;
            this.callback = callback;
            this.draggedElement = null;
            this.status = 0 /* off */;
            this.lastIndex = -1;
            this.draggedElementDisplayStyle = null;
            this.element.addEventListener('dragstart', this.handleDragStart.bind(this), false);
            this.element.addEventListener('dragenter', this.handleDragEnter.bind(this), false);
            this.element.addEventListener('dragend', this.handleDragEnd.bind(this), false);
        }
        DnDContainerBehavior.prototype.handleDragStart = function (e) {
            this.draggedElement = e.target;
            e.dataTransfer.effectAllowed = 'move';
            this.status = 1 /* start */;
            this.lastIndex = index(this.draggedElement);
            this.draggedElementDisplayStyle = this.draggedElement.style.display;
        };

        DnDContainerBehavior.prototype.handleDragEnd = function (e) {
            this.draggedElement.style.display = this.draggedElementDisplayStyle;
            this.status = 0 /* off */;
            before(this.placeHolder, this.draggedElement);
            this.element.removeChild(this.placeHolder);
            var lastIndex = this.lastIndex;
            var newIndex = index(this.draggedElement);
            this.lastIndex = -1;
            this.draggedElement = null;
            this.draggedElementDisplayStyle = null;
            this.callback(lastIndex, newIndex);
        };

        DnDContainerBehavior.prototype.handleDragEnter = function (e) {
            if (this.status == 1 /* start */) {
                this.draggedElement.style.display = "none";
                this.status = 2 /* enter */;
            }
            var element = e.target;
            if (element.parentNode == this.element) {
                var indexPlaceHolder = index(this.placeHolder);
                var indexElement = index(element);
                if (indexPlaceHolder < indexElement) {
                    after(element, this.placeHolder);
                } else {
                    before(element, this.placeHolder);
                }
            }
        };
        return DnDContainerBehavior;
    })();
    DomUtil.DnDContainerBehavior = DnDContainerBehavior;
})(DomUtil || (DomUtil = {}));
/// <reference path="util.ts" />
var robotcode;
(function (robotcode) {
    var Cell = (function () {
        function Cell() {
        }
        return Cell;
    })();
    robotcode.Cell = Cell;
    ;

    var Grid = (function () {
        function Grid() {
        }
        return Grid;
    })();
    robotcode.Grid = Grid;
    ;

    var Robot = (function () {
        function Robot() {
            this.x = 0;
            this.y = 0;
            this.angle = 0;
        }
        return Robot;
    })();
    robotcode.Robot = Robot;
    ;

    var World = (function () {
        function World(robot, grid) {
            this.robot = robot;
            this.grid = grid;
        }
        return World;
    })();
    robotcode.World = World;
    ;

    var Action = (function () {
        function Action(name, description, container) {
            if (typeof container === "undefined") { container = false; }
            this.name = name;
            this.description = description;
            this.container = container;
        }
        return Action;
    })();
    robotcode.Action = Action;
    ;

    var ActionInstance = (function () {
        function ActionInstance(action) {
            this.action = action;
            this.executing = false;
        }
        return ActionInstance;
    })();
    robotcode.ActionInstance = ActionInstance;
    ;

    var ActionContainer = (function () {
        function ActionContainer() {
            this.actions = [];
        }
        return ActionContainer;
    })();
    robotcode.ActionContainer = ActionContainer;
    ;

    var Control = (function () {
        function Control() {
        }
        return Control;
    })();
    robotcode.Control = Control;
    ;

    var AvailableActions = (function () {
        function AvailableActions(actions) {
            this.actions = actions;
        }
        return AvailableActions;
    })();
    robotcode.AvailableActions = AvailableActions;
    ;

    var Context = (function () {
        function Context() {
            this.map = {};
        }
        Context.prototype.set = function (key, value) {
            this.map[key] = value;
        };
        Context.prototype.get = function (key) {
            var map = this.map;
            var parent = this.parent;
            while (!(key in map) && parent) {
                map = parent.map;
                parent = parent.parent;
            }
            return map[key];
        };
        return Context;
    })();
    robotcode.Context = Context;

    robotcode.mapActions = {};

    function createGrid(gridValue) {
        var grid = new Grid();
        grid.width = gridValue.grid[0].length;
        grid.height = gridValue.grid.length;

        var cells = [];
        for (var i = 0; i < grid.width; ++i) {
            cells[i] = [];
            for (var j = 0; j < grid.height; ++j) {
                var cell = new Cell();
                cell.color = gridValue.colors[gridValue.grid[j][i]];
                cells[i][j] = cell;
            }
        }
        grid.cells = cells;
        return grid;
    }
    robotcode.createGrid = createGrid;

    function createActionInstance(action) {
        var actionInstance = new ActionInstance(action);
        if (action.container) {
            actionInstance.container = new ActionContainer();
        }
        return actionInstance;
    }

    var Script = (function () {
        function Script(world) {
            var _this = this;
            this.currentIndex = 0;
            this.isPaused = true;
            this.scriptContainer = new ActionContainer();
            this.end = function () {
                _this.stop();
            };
            this.next = function () {
                if (!_this.isPaused) {
                    if (_this.currentIndex >= 0 && _this.currentIndex < _this.scriptContainer.actions.length) {
                        if (_this.currentActionInstance)
                            _this.currentActionInstance.executing = false;
                        _this.currentActionInstance = _this.scriptContainer.actions[_this.currentIndex];
                        _this.currentActionInstance.executing = true;
                        _this.currentIndex++;
                        robotcode.mapActions[_this.currentActionInstance.action.name](_this.context, _this.currentIndex < _this.scriptContainer.actions.length ? _this.next : _this.end);
                    } else {
                        _this.end();
                    }
                }
            };
            this.context = new Context();
            this.context.set("world", world);
            this.control = new Control();
        }
        Script.prototype.add = function (action) {
            var actionInstance = createActionInstance(action);
            this.scriptContainer.actions.push(actionInstance);
            return this;
        };
        Script.prototype.move = function (action, newIndex) {
            this.remove(action);
            this.scriptContainer.actions.splice(newIndex, 0, action);
        };
        Script.prototype.remove = function (action) {
            var lastIndex = this.scriptContainer.actions.indexOf(action);
            this.scriptContainer.actions.splice(lastIndex, 1);
        };
        Script.prototype.play = function () {
            this.isPaused = false;
            this.control.playing = true;
            this.next();
            return this;
        };
        Script.prototype.pause = function () {
            this.isPaused = true;
            this.control.playing = false;
            return this;
        };
        Script.prototype.stop = function () {
            this.currentIndex = 0;
            if (this.currentActionInstance)
                this.currentActionInstance.executing = false;
            return this.pause();
        };
        Script.prototype.clear = function () {
            this.stop();
            this.scriptContainer.actions.splice(0, this.scriptContainer.actions.length);
            return this;
        };
        return Script;
    })();
    robotcode.Script = Script;
    ;
})(robotcode || (robotcode = {}));
/// <reference path="robotcode.ts" />
/// <reference path="../lib/tweenjs.d.ts" />
var actions;
(function (actions) {
    function setCellColor(grid, x, y, color) {
        var cell = grid.cells[x][y];
        if (cell) {
            cell.color = color;
        }
    }

    function canMove(grid, x, y) {
        if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
            return grid.cells[x][y].color != "#000000";
        }
        return false;
    }

    var rotate = function (robot, angle, callback) {
        if (robot.angle == angle || robot.angle == angle - 360) {
            callback();
        } else {
            if (Math.abs(robot.angle - angle) > Math.abs(robot.angle - (angle - 360))) {
                angle = angle - 360;
            }
            createjs.Tween.get(robot).to({ angle: angle }, 500).call(callback);
        }
    };

    var move = function (offsetX, offsetY, angle) {
        return function (context, callback) {
            var world = context.get("world");
            var robot = world.robot;
            var grid = world.grid;
            rotate(robot, angle, function () {
                if (!canMove(grid, robot.x + offsetX, robot.y + offsetY)) {
                    createjs.Tween.get(robot).to({ x: robot.x + offsetX * 0.2, y: robot.y + offsetY * 0.2 }, 300).to({ x: robot.x, y: robot.y }, 300).call(callback);
                } else {
                    createjs.Tween.get(robot).to({ x: robot.x + offsetX, y: robot.y + offsetY }, 1000).call(callback);
                }
            });
        };
    };

    var color = function (color) {
        return function (context, callback) {
            var world = context.get("world");
            var robot = world.robot;
            var grid = world.grid;
            setCellColor(grid, robot.x, robot.y, color);
            setTimeout(callback, 500);
        };
    };

    var repeat = function (context, callback) {
        var index = context.get("index");
        if (isNaN(index)) {
            index = 0;
        }
        console.log("index: " + index);
        var canContinue = index < 3;
        if (canContinue) {
            index++;
            context.set("index", index);
        } else {
            context.set("index", null);
        }

        setTimeout(callback, 500, canContinue);
    };

    actions.up = new robotcode.Action("up", "move up");
    actions.down = new robotcode.Action("down", "move down");
    actions.left = new robotcode.Action("left", "move left");
    actions.right = new robotcode.Action("right", "move right");
    actions.colorRed = new robotcode.Action("colorRed", "color tile in red");
    actions.colorGreen = new robotcode.Action("colorGreen", "color tile in green");
    actions.repeat3Times = new robotcode.Action("repeat3Times", "repeat 3 times", true);

    robotcode.mapActions[actions.up.name] = move(0, -1, -90);
    robotcode.mapActions[actions.down.name] = move(0, 1, 90);
    robotcode.mapActions[actions.left.name] = move(-1, 0, 180);
    robotcode.mapActions[actions.right.name] = move(1, 0, 0);
    robotcode.mapActions[actions.colorRed.name] = color("#FF0000");
    robotcode.mapActions[actions.colorGreen.name] = color("#00FF00");
    robotcode.mapActions[actions.repeat3Times.name] = repeat;
})(actions || (actions = {}));
/// <reference path="robotcode.ts" />
/// <reference path="actions.ts" />
/// <reference path="util.ts" />

var gridValue = {
    colors: {
        "B": "#000000",
        "W": "#CCCCCC"
    },
    grid: [
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
};

var range = function (begin, end) {
    var offset = begin > end ? end : begin;
    var delta = Math.abs(end - begin);

    var result = [];
    for (var i = 0; i < delta; i++) {
        result.push(i + offset);
    }
    ;
    return result;
};

var add = function (container, item, newIndex) {
    container.splice(newIndex, 0, item);
};
var remove = function (container, item) {
    var lastIndex = container.indexOf(item);
    container.splice(lastIndex, 1);
};
var move = function (container, item, newIndex) {
    remove(container, item);
    add(container, item, newIndex);
};

var grid = robotcode.createGrid(gridValue);
var robot = new robotcode.Robot();

var world = new robotcode.World(robot, grid);
var script = new robotcode.Script(world);
var availableActions = new robotcode.AvailableActions([actions.up, actions.down, actions.left, actions.right, actions.colorRed, actions.colorGreen, actions.repeat3Times]);

Vue.directive("sortable", {
    isFn: true,
    bind: function () {
        if (!this.el.sortable) {
            var vm = this.vm;
            var data = this.el.dataset;
            this.el.sortable = new Sortable(this.el, { group: data.group, handle: data.handle });
            this.el.sortable.countListeners = 0;
        }
    },
    update: function (fn) {
        var vm = this.vm;
        this.handler = function (e) {
            fn.call(vm, e);
        };
        this.el.addEventListener(this.arg, this.handler);
    },
    unbind: function () {
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
        play: function () {
            script.play();
        },
        pause: function () {
            script.pause();
        },
        clear: function () {
            script.clear();
        },
        stop: function () {
            script.stop();
        }
    }
});

var availableActionsView = new Vue({
    el: ".availableActions",
    data: availableActions,
    methods: {
        add: function (action) {
            script.add(action);
        }
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
        add: function (event) {
            add(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
        },
        update: function (event) {
            move(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
        },
        remove: function (event) {
            remove(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance);
        }
    }
});
