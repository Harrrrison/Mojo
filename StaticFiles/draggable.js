
var dragging = null;
var dragging_source = null;
var currently_swapped = null;
var currently_swapped_from = null;

const elems = document.getElementsByClassName("draggable");
for (const elem of elems) {
    elem.draggable="true";
    elem.style.cursor="move";
    elem.addEventListener("mouseenter", function (e) {
	this.classList.add("focused");
    });
    elem.addEventListener("mouseleave", function (e) {
	this.classList.remove("focused");
    });
    elem.addEventListener("dragstart", function (e) {
	this.classList.add("dragging");
	dragging_source = this.parentElement;
	dragging = this;
    });
    elem.addEventListener("dragend", function (e) {
	this.classList.remove("dragging");
	currently_swapped = null;
	currently_swapped_from = null;
    });
}

const containers = document.getElementsByClassName("draggable-container-box");
for (const container of containers) {
    container.addEventListener("dragover", function (e) {
	e.preventDefault();
	
	if (currently_swapped && currently_swapped_from !== this) {
	    currently_swapped_from.appendChild(currently_swapped);
	}

	// act as a swap
	if (this.children.length > 0) {
	    if (currently_swapped_from !== this) {
		currently_swapped = this.children[0];
	    }
	    dragging_source.appendChild(this.children[0]);
	} else {
	    currently_swapped = null;
	}
	currently_swapped_from = this;
	
	this.appendChild(dragging);
    });
}
