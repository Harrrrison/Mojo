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

function fetchStats(accessToken, url, keyToFind, elementId, multiple = false) {
    fetch(url, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
        .then(response => response.json())
        .then(data => {
            try {
                console.log(data);
                const returnData = findData(data, keyToFind); // Extract names
                // Convert names array to a string for display, e.g., as a list
                const output = returnData.map(returnData => `<p>${returnData}</p>`).join('');
                if (multiple){
                    const artistFollowers = findData(data, 'followers');
                    const artistGenre = findData(data, 'genres');
                    const artistPFP = findData(data, 'images');
                    const artistPopularity = findData(data, 'popularity');
                    console.log('artist G', artistGenre);
                    returnData.forEach((returnData, index) => {
                        const element = document.getElementById(`${elementId}${index+1}`);
                        if (element) {
                            element.innerHTML= `
                    <div class="artist-info">
                        <p>${index + 1}.</p>
                        <p>Name: ${returnData}</p>
                        <p>Followers: ${(Math.round((artistFollowers[index]['total']/1000))*1000).toLocaleString()}</p>
                        <p>Genre: ${artistGenre[index][0]}, ${artistGenre[index][1]}, ${artistGenre[index][2]}</p>
                        <p>Popularity score: ${artistPopularity[index]}</p>
                        <img src="${artistPFP[index][0]['url']}" alt="Artist profile picture">
                    </div>`;
                            //element.innerHTML = `<p>${returnData}</p>`; // Display each username in its respective element
                        }
                    });
                }else{

                    document.getElementById(elementId).innerHTML = `<ul>${output}</ul>`;
                }

            } catch (e) {
                console.error("Parsing error:", e);
                document.getElementById(elementId).innerHTML = "Error parsing JSON data.";
            }
        })

        .catch(error => console.error(error));
}

//export {fetchStats};

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
                // Added <span> tag to change color of the text
                const output = username.map(username => `<p> <span style="color: black;">Hello</span> ${username}.</p>`).join('');
                document.getElementById('data').innerHTML = `<p>${output}</p>`;
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


// Track features
let acoustic = 0.0;
let dance = 0.0;
let energy = 0.0;
let instrument = 0.0;
let speech = 0.0;
let valence = 0.0;
let liveness = 0.0;
fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', {
    headers: { 'Authorization': 'Bearer ' + accessToken }
})
.then(response => response.json())
.then(data => {
    try {
        let trackIDForFeatures = data.items.slice(0, 10).map(track => track.id); 
        const fetchPromises = trackIDForFeatures.map(trackID => {
            return fetch('https://api.spotify.com/v1/audio-features/' + trackID, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            })
            .then(response => response.json())
            .then(data => {
                acoustic += data.acousticness;
                dance += data.danceability;
                energy += data.energy;
                instrument += data.instrumentalness;
                speech += data.speechiness;
                valence += data.valence;
                liveness += data.liveness;
            })
            .catch(error => console.error(error));
        });

        // Wait for all fetch requests to complete
        Promise.all(fetchPromises)
        .then(() => {
            // Output the final sums as percentages with two decimal places
            console.log("Acoustic:", ((acoustic / 10) * 100).toFixed(2));
            console.log("Danceability:", ((dance / 10) * 100).toFixed(2));
            console.log("Energy:", ((energy / 10) * 100).toFixed(2));
            console.log("Instrumentalness:", ((instrument / 10) * 100).toFixed(2));
            console.log("Speechiness:", ((speech / 10) * 100).toFixed(2));
            console.log("Valence:", ((valence / 10) * 100).toFixed(2));
            console.log("Liveness:", ((liveness / 10) * 100).toFixed(2));
            })
        .catch(error => console.error(error));
    } catch (e) {
        console.error("Parsing error:", e);
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

    fetchStats(accessToken, 'https://api.spotify.com/v1/audio-analysis/11dFghVXANMlKmJXsNCbNl',
               'start', 'testBox');// this is a test to see if the function works


}

//interactjs.io

//import interact from 'interactjsj';
//

const position = { x: 0, y: 0 };

interact('.resize-drag').draggable({
    modifiers: [
        interact.modifiers.snap({
            targets: [interact.snappers.grid({ x: 20, y: 20 })],
            range: Infinity,
            relativePoints: [{ x: 0, y: 0 }]
        })
    ],
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
