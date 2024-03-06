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
    });
    elem.addEventListener("dragend", function (e) {
	this.classList.remove("dragging");
    });
}

const containers = document.getElementsByClassName("draggable-container-box");
for (const container of containers) {
    container.addEventListener("dragover", function (e) {
	e.preventDefault();
	const dragging = document.getElementsByClassName("dragging");
	const dragging_source = dragging[0].parentElement;
	// act as a swap
	if (this.children.length > 0) {
	    dragging_source.appendChild(this.children[0]);
	}
	this.appendChild(dragging[0]);
    });
}
