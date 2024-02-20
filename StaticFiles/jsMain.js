// Front end code for the spotify API (index.js)
// Parse the URL to get the access token if it's there
// https://developer.spotify.com/documentation/web-api
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

function findData(obj, keyToFind) {
    // This will be modified to find X but work needs to be done
    const names = [];

    function recurse(element) {
        // recursivley itterated though the json as some of the api responses are nested
        if (typeof element === 'object' && element !== null) {
            for (const key in element) {
                if (key === keyToFind) {
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
            try {
                const username = findData(data, 'display_name'); // Extract names
                // Convert names array to a string for display, e.g., as a list
                const output = username.map(username => `<p>Hello ${username}</p>`).join('');
                document.getElementById('data').innerHTML = `<ul>${output}</ul>`;
            } catch (e) {
                console.error("Parsing error:", e);
                document.getElementById('data').innerHTML = "Error parsing JSON data.";
            }
        })

        .catch(error => console.error(error));
// this block can be reused for all other stats, look at the link above for the params needed in the url

// Top Artists
fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term', {
    headers: { 'Authorization': 'Bearer ' + accessToken }
})
    .then(response => response.json())
    .then(data => {
        try {
            const names = findData(data, 'name'); // Extract names
            // Convert names array to a string for display, e.g., as a list
            const namesList = names.map(name => `<li>${name}</li>`).join('');
            document.getElementById('topArtists').innerHTML = `<h3>Top Artists</h3><ol start="1">${namesList}</ol>`;
        } catch (e) {
            console.error("Parsing error:", e);
            document.getElementById('topArtists').innerHTML = "Error parsing JSON data.";
        }
    })
    .catch(error => console.error(error));

// Top Songs
fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', {
headers: { 'Authorization': 'Bearer ' + accessToken }
})
.then(response => response.json())
.then(data => {
    try {
        const songNames = data.items.slice(0, 10).map(song => song.name); // Extract song names. Used this as there are multiple names held. May need to be changed if we vary the number of songs we display
        // Convert songNames array to a string for display, e.g., as a list
        const namesList = songNames.map(name => `<li>${name}</li>`).join('');
        document.getElementById('topSongs').innerHTML = `<h3>Top Songs</h3><ol start="1">${namesList}</ol>`;
    } catch (e) {
        console.error("Parsing error:", e);
        document.getElementById('topSongs').innerHTML = "Error parsing JSON data.";
    }
})
.catch(error => console.error(error));


// Popularity score of top songs turned into uniqueness score
fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', {
headers: { 'Authorization': 'Bearer ' + accessToken }
})
.then(response => response.json())
.then(data => {
    try {
        const popularity = findData(data, 'popularity'); // Extract popularity of each top song
        const sum = popularity.reduce((a, b) => a + b, 0); // Sums up the popularity of each top song
        const uniquenessScore = 100 - Math.ceil(sum / popularity.length); // Gives an average of popularity and then inverts it to get uniqueness score
        document.getElementById('popularity').innerHTML = `<p>Uniqueness: ${uniquenessScore}%</p>`;
    } catch (e) {
        console.error("Parsing error:", e);
        document.getElementById('popularity').innerHTML = "Error parsing JSON data.";
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

//import interact from 'interactjsj';


const position = { x: 0, y: 0 };

interact('.resize-drag').draggable({
    listeners: {
        start(event) {
            console.log('drag started', event);
        },
        move(event) {

            position.x += event.dx;
            position.y += event.dy;

            event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;

            console.log(`Moved to: ${position.x}, ${position.y}`);
        }
    }
})
    .resizable({
        edges: { top: true, left: true, bottom: true, right: true },
        listeners: {
            start(event) {
                console.log('resize started', event);
            },

            move: function (event) {
                let { x, y } = event.target.dataset

                x = (parseFloat(x) || 0) + event.deltaRect.left
                y = (parseFloat(y) || 0) + event.deltaRect.top

                Object.assign(event.target.style, {
                    // Need to work out a way to scale the text size aswell super doable
                    width: `${event.rect.width}px`,
                    height: `${event.rect.height}px`,
                    //transform: `translate(${x}px, ${y}px)` // This line is causing the issue
                })

                Object.assign(event.target.dataset, { x, y })

                console.log(`Resized to: ${x}px, ${y}px`);
            }
        }
    })