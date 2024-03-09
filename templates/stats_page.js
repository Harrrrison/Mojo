// builder function
function tag(type, ...children) {
    const res = document.createElement(type);
    for (const child of children) {
	if (typeof(child) === 'string') {
	    res.appendChild(document.createTextNode(child));
	} else {
	    res.appendChild(child);
	}
    }

    res.inner_html$ = function (html) {
	this.innerHTML = html;
	return this;
    }
    
    res.id$ = function (value) {
	this.setAttribute("id", value);
	return this;
    }
    
    res.class$ = function (value) {
	this.setAttribute("class", value);
	return this;
    }
    
    res.attr$ = function(name, value) {
	this.setAttribute(name, value);
	return this;
    };

    return res;
}

const types = ["p", "div", "h1", "h2", "h3", "span", "em", "a", "canvas", "label"];
for (const type of types) {
    window[type] = (...children) => tag(type, ...children);
}

function select(name, ...children) {
    return tag("select", ...children).attr$("name", name);
}

function option(value, ...children) {
    return tag("option", ...children).attr$("value", value);
}

const entry = document.getElementById("rest";)

const selection_options = [<%selection_options%>];
const options = selection_options.map(o => option(o, o));

var selection = null;

function refresh() {
    var selected = options[0];
    if (entry.children.length > 0) {
	if (selection) {
	    selected = selection.value;
	}
	entry.removeChild(entry.children[0]);
    }
    selection = select("visits", ...options)
	.id$("visits-selection")
	.attr$("onchange", "refresh()");
    selection.value = selected;

    const body = div(selection, div().inner_html(values[selected]));
    entry.appendChild(body);
}

refresh();
