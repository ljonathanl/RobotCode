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
        function Robot(x, y) {
            this.x = x;
            this.y = y;
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

    var ActionDefinition = (function () {
        function ActionDefinition(name, description, container) {
            if (typeof container === "undefined") { container = false; }
            this.name = name;
            this.description = description;
            this.container = container;
        }
        return ActionDefinition;
    })();
    robotcode.ActionDefinition = ActionDefinition;
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

    robotcode.actions = {};

    robotcode.mapActions = {};

    function createAction() {
    }
    robotcode.createAction = createAction;

    function createWorld(worldValue) {
        var grid = new Grid();
        grid.width = worldValue.grid[0].length;
        grid.height = worldValue.grid.length;

        var cells = [];
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
    robotcode.createWorld = createWorld;

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
            this.currentContainer = this.scriptContainer;
            this.next = function () {
                if (!_this.isPaused) {
                    var executeChildren = _this.context.executeChildren;
                    if (executeChildren) {
                        _this.enterContainer(_this.currentActionInstance.container);
                    }
                    var redo = _this.context.redo;
                    var index = _this.context.index;
                    var container = _this.context.container;
                    if (!redo) {
                        index++;
                        _this.context.index = index;
                    }
                    if (index >= 0 && index < container.actions.length) {
                        if (_this.currentActionInstance)
                            _this.currentActionInstance.executing = false;
                        _this.currentActionInstance = container.actions[index];
                        _this.currentActionInstance.executing = true;
                        _this.context.instance = _this.currentActionInstance;
                        robotcode.mapActions[_this.currentActionInstance.action.name](_this.context, _this.next);
                    } else {
                        if (_this.context.parent) {
                            _this.exitContainer();
                            _this.next();
                        } else {
                            _this.stop();
                        }
                    }
                }
            };
            this.control = new Control();
            this.load();
            this.initContext();
        }
        Script.prototype.load = function () {
            this.scriptContainer = (localStorage && JSON.parse(localStorage.getItem("script"))) || new ActionContainer();
        };

        Script.prototype.save = function () {
            localStorage.setItem("script", JSON.stringify(this.scriptContainer));
        };

        Script.prototype.initContext = function () {
            var context = new Context();
            context.set("world", world);
            context.container = this.scriptContainer;
            context.index = -1;
            context.executeChildren = false;
            context.redo = false;
            this.context = context;
        };

        Script.prototype.create = function (action) {
            var actionInstance = createActionInstance(action);
            this.scriptContainer.actions.push(actionInstance);
            this.save();
        };

        Script.prototype.add = function (container, item, newIndex) {
            container.splice(newIndex, 0, item);
            this.save();
        };
        Script.prototype.remove = function (container, item) {
            var lastIndex = container.indexOf(item);
            container.splice(lastIndex, 1);
            this.save();
        };
        Script.prototype.move = function (container, item, newIndex) {
            var lastIndex = container.indexOf(item);
            container.splice(lastIndex, 1);
            container.splice(newIndex, 0, item);
            this.save();
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
            this.initContext();
            if (this.currentActionInstance) {
                this.currentActionInstance.executing = false;
                this.currentActionInstance = null;
            }
            return this.pause();
        };
        Script.prototype.clear = function () {
            this.stop();
            this.scriptContainer.actions.splice(0, this.scriptContainer.actions.length);
            this.save();
            return this;
        };

        Script.prototype.enterContainer = function (container) {
            var context = new Context();
            context.index = -1;
            context.container = container;
            context.executeChildren = false;
            context.redo = false;
            context.parent = this.context;
            this.context = context;
        };

        Script.prototype.exitContainer = function () {
            if (this.context.parent) {
                this.context = this.context.parent;
                this.context.executeChildren = false;
            }
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
    function setCellState(grid, x, y, state) {
        var cell = grid.cells[x][y];
        if (cell) {
            cell.state = state;
        }
    }

    function getCellState(grid, x, y) {
        var result = null;
        var cell = grid.cells[x][y];
        if (cell) {
            result = cell.state;
        }
        return result;
    }

    function canMove(grid, x, y) {
        if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
            return grid.cells[x][y].state != "hole";
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

    var state = function (state) {
        return function (context, callback) {
            var world = context.get("world");
            var robot = world.robot;
            var grid = world.grid;
            setCellState(grid, robot.x, robot.y, state);
            setTimeout(callback, 500);
        };
    };

    var repeat = function (count) {
        return function (context, callback) {
            var repeatTime = context.get("repeatTime");
            if (isNaN(repeatTime)) {
                repeatTime = 0;
            }
            console.log("repeatTime: " + repeatTime);
            var canContinue = repeatTime < count;
            if (canContinue) {
                repeatTime++;
                context.set("repeatTime", repeatTime);
            } else {
                context.set("repeatTime", null);
            }
            context.executeChildren = canContinue;
            context.redo = canContinue;

            setTimeout(callback, 500);
        };
    };

    var ifState = function (state) {
        return function (context, callback) {
            var world = context.get("world");
            var robot = world.robot;
            var grid = world.grid;
            var cellState = getCellState(grid, robot.x, robot.y);
            context.executeChildren = state == cellState;

            setTimeout(callback, 500);
        };
    };

    actions.up = new robotcode.ActionDefinition("up", "move up");
    actions.down = new robotcode.ActionDefinition("down", "move down");
    actions.left = new robotcode.ActionDefinition("left", "move left");
    actions.right = new robotcode.ActionDefinition("right", "move right");
    actions.stateColor1 = new robotcode.ActionDefinition("stateColor1", "state tile in color1");
    actions.stateColor2 = new robotcode.ActionDefinition("stateColor2", "state tile in color2");
    actions.repeat2Times = new robotcode.ActionDefinition("repeat2Times", "repeat 2 times", true);
    actions.repeat3Times = new robotcode.ActionDefinition("repeat3Times", "repeat 3 times", true);
    actions.repeat4Times = new robotcode.ActionDefinition("repeat4Times", "repeat 4 times", true);
    actions.ifColor1 = new robotcode.ActionDefinition("ifColor1", "if the state of the tile is red", true);
    actions.ifColor2 = new robotcode.ActionDefinition("ifColor2", "if the state of the tile is green", true);

    robotcode.mapActions[actions.up.name] = move(0, -1, 180);
    robotcode.mapActions[actions.down.name] = move(0, 1, 0);
    robotcode.mapActions[actions.left.name] = move(-1, 0, 90);
    robotcode.mapActions[actions.right.name] = move(1, 0, -90);
    robotcode.mapActions[actions.stateColor1.name] = state("color1");
    robotcode.mapActions[actions.stateColor2.name] = state("color2");
    robotcode.mapActions[actions.repeat2Times.name] = repeat(2);
    robotcode.mapActions[actions.repeat3Times.name] = repeat(3);
    robotcode.mapActions[actions.repeat4Times.name] = repeat(4);
    robotcode.mapActions[actions.ifColor1.name] = ifState("color1");
    robotcode.mapActions[actions.ifColor2.name] = ifState("color2");
})(actions || (actions = {}));
/// <reference path="robotcode.ts" />
/// <reference path="actions.ts" />
/// <reference path="util.ts" />

var worldValue = {
    states: {
        "H": "hole",
        "N": "none",
        "1": "color1",
        "2": "color2"
    },
    grid: [
        "NNNNNHHHNNNNN",
        "1HNN11NNNNNNN",
        "NNNNNHNNNNNHH",
        "NNNNNNNNNHNNN",
        "NNNHNNNNNNNHN",
        "N21NNNNNNHNHN",
        "NNNNN2NNNN22N"
    ],
    robot: {
        x: 4,
        y: 4
    },
    actions: []
};

var range = function (begin, end) {
    var offset = begin > end ? end : begin;
    var delta = Math.abs(end - begin);

    var result = [];
    for (var i = 0; i < delta; i++) {
        result.push(i + offset);
    }
    return result;
};

var degToRad = Math.PI / 180;
var toPosition = function (angle, offset) {
    var x, y = 0;
    var angleRad = angle * degToRad;
    x = Math.round(offset * Math.cos(angleRad));
    y = Math.round(offset * Math.sin(angleRad));

    return x + "px " + y + "px";
};

var world = robotcode.createWorld(worldValue);
var grid = world.grid;
var robot = world.robot;

var script = new robotcode.Script(world);
var availableActions = new robotcode.AvailableActions([
    actions.up,
    actions.down,
    actions.left,
    actions.right,
    actions.stateColor1,
    actions.stateColor2,
    actions.ifColor1,
    actions.ifColor2,
    actions.repeat2Times,
    actions.repeat3Times,
    actions.repeat4Times
]);

var initClasses = function (i, j) {
    var classes = [];
    var cells = grid.cells;
    var cell = cells[i][j];
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
};

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
        range: range,
        initClasses: initClasses
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
        play: function () {
            script.play();
        },
        pause: function () {
            script.pause();
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
            script.create(action);
        }
    }
});

var garbageView = new Vue({
    el: ".garbage",
    methods: {
        clear: function () {
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
        add: function (event) {
            script.add(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
        },
        update: function (event) {
            script.move(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance, event.index);
        },
        remove: function (event) {
            script.remove(event.container.vue_vm.$data.actions, event.element.vue_vm.$data.actionInstance);
        }
    }
});
