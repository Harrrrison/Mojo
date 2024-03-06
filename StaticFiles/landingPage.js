//import {fetchStats} from "./jsMain.js";
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

// I know this is a duplicate block of code but when i use export and import it break the stats page so this is the
// fix for not

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

function fetchStats(accessToken, url, keyToFind, elementId, type) {
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
                if (type === 'artist'){
                    const artistFollowers = findData(data, 'followers');
                    const artistGenre = findData(data, 'genres');
                    const artistPFP = findData(data, 'images');
                    const artistPopularity = findData(data, 'popularity');
                    console.log('artist G', artistGenre);
                    returnData.forEach((returnData, index) => {
                        const element = document.getElementById(`${elementId}${index+1}`);
                        if (element) {
                            let genre = artistGenre[index][0];
                            genre = genre.replace(/\b\w/g, c => c.toUpperCase());
                            element.innerHTML= `
                    <div class="artist-info">
                        <p>${index + 1}.</p>
                        <p>Name: ${returnData}</p>
                        <p>Followers: ${(Math.round((artistFollowers[index]['total']/1000))*1000).toLocaleString()}</p>
                        <p>Genre: ${genre}</p>
                        <p>Popularity score: ${artistPopularity[index]}</p>
                        <img src="${artistPFP[index][2]['url']}" alt="Artist profile picture" class ="artistImage">
                    </div>`; // there are 3 sizes of the images provided by spotify and are selected with the second index
                            // may also change the Genera part to just have index 0
                            // The follewers are rounded to the nearest 1000 and then formatted to the local norm of
                            //displaying numbbers in the users country
                        }
                    });
                }else if(type === 'track'){

                    const name = data.items.map(item => item.name);
                    const genres = data.items.map(item => item.genres);
                    const songPFP = findData(data, 'images');
                    const type= findData(data, 'type');
                    returnData.forEach((returnData, index) => {
                        const element = document.getElementById(`${elementId}${index + 6}`);
                        if (element) {
                            element.innerHTML = `
                    <div class="song-info">
                        <p>${index + 1}.</p>
                        <p>Name: ${name[index]}</p>
                        <img src="${songPFP[index][2]['url']}" alt="Song profile picture" class ="songImage">
                    </div>`
                        }
                    });
                }
                else{

                    document.getElementById(elementId).innerHTML = `<ul>${output}</ul>`;
                }

            } catch (e) {
                console.error("Parsing error:", e);
                document.getElementById(elementId).innerHTML = "Error parsing JSON data.";
            }
        })

        .catch(error => console.error(error));
}

fetchStats(accessToken, 'https://api.spotify.com/v1/me/top/artists?limit=5&time_range=long_term',
    'name', 'item-container', 'artist');// need the element Id
//fetchStats(accessToken, 'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term',
 //   'followers', 'artist-followers', true);

fetchStats(accessToken, 'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term','name',
    'item-container', 'track');

