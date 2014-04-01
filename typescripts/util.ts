module DomUtil {
	export function before(element:Element, insert:Element) {
		if (element.parentNode) {
            element.parentNode.insertBefore(insert, element);
        }
	}

	export function after(element:Element, insert:Element) {
		if (element.parentNode) {
            element.parentNode.insertBefore(insert, element.nextSibling);
        }
	}

	export function index(element:Element) {
		for (var k=0,e=element; e = e.previousElementSibling; ++k);
		return k;
	}

	enum Statuses {off, start, enter};

	export class DnDContainerBehavior {
		private draggedElement:HTMLElement = null;
		private status:Statuses = Statuses.off;
		private lastIndex = -1;
		private draggedElementDisplayStyle:string = null;
		constructor(public element:Element, public placeHolder:Element, public callback:(lastIndex:number, newIndex:number)=>void) {
			this.element.addEventListener('dragstart', this.handleDragStart.bind(this), false);
			this.element.addEventListener('dragenter', this.handleDragEnter.bind(this), false);
			this.element.addEventListener('dragend', this.handleDragEnd.bind(this), false);
		}

		private handleDragStart(e:DragEvent) {
			this.draggedElement = <HTMLElement>e.target;
			e.dataTransfer.effectAllowed = 'move';
			this.status = Statuses.start;
			this.lastIndex = index(this.draggedElement);
			this.draggedElementDisplayStyle = this.draggedElement.style.display;
		}

		private handleDragEnd(e:DragEvent) {
			this.draggedElement.style.display = this.draggedElementDisplayStyle;
			this.status = Statuses.off;
			before(this.placeHolder, this.draggedElement);
			this.element.removeChild(this.placeHolder);
			var lastIndex = this.lastIndex;
			var newIndex = index(this.draggedElement);
			this.lastIndex = -1;
			this.draggedElement = null;
			this.draggedElementDisplayStyle = null;
			this.callback(lastIndex, newIndex);
		}

		private handleDragEnter(e:DragEvent) {
			if (this.status == Statuses.start) {
				this.draggedElement.style.display = "none";
				this.status = Statuses.enter;
			}
			var element:HTMLElement = <HTMLElement>e.target;
			if (element.parentNode == this.element) {
				var indexPlaceHolder = index(this.placeHolder);
				var indexElement = index(element);
				if (indexPlaceHolder < indexElement) {
					after(element, this.placeHolder);
				} else {
					before(element, this.placeHolder);
				}
			}
		}


	}
}