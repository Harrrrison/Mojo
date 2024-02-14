// Front end code for the spotify API (index.js)
// Parse the URL to get the access token if it's there
// https://developer.spotify.com/documentation/web-api
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

function findNames(obj) {
    // This will be modified to find X but work needs to be done
    const names = [];

    function recurse(element) {
        // recursivley itterated though the json as some of the api responses are nested
        if (typeof element === 'object' && element !== null) {
            for (const key in element) {
                if (key === 'name') {
                    // keyword name being looked for
                    names.push(element[key]);
                    // if found the name is pushed to the array, to be returned
                } else if (typeof element[key] === 'object') {
                    recurse(element[key]);
                }
            }
        }
    }

    recurse(obj);
    return names;
}

if (accessToken) {
    // Use the access token to make API requests
    fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('data').innerHTML = JSON.stringify(data, null, 2);
        })

        .catch(error => console.error(error));

    fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
        .then(response => response.json())
        .then(data => {
            try {
                const names = findNames(data); // Extract names
                // Convert names array to a string for display, e.g., as a list
                const namesList = names.map(name => `<li>${name}</li>`).join('');
                document.getElementById('topArtists').innerHTML = `<ul>${namesList}</ul>`;
            } catch (e) {
                console.error("Parsing error:", e);
                document.getElementById('topArtists').innerHTML = "Error parsing JSON data.";
            }
        })
        .catch(error => console.error(error));

}

// Draggable code
// Below is the commented out method I wrote (doenst work very well if at all)
//dragElement(document.getElementById("TopArtistsDraggableBox"));

function dragElement(elmnt) {

    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    if (document.getElementById(elmnt.id + "Header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }



function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
}


function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
}

function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;

}
}

//interactjs.io

// es6 import
import interact from 'interactjs'

const position = { x: 500, y: 800}

interact('.draggable').draggable({

    listeners:{
        // debugger
        start(event){
            console.log('drag started', event);
        },

        move(event){
            position.x += event.dx;
            position.y += event.dy;

            event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
        }
    }
})