// Front end code for the spotify API (index.js)
// Parse the URL to get the access token if it's there
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

function findNames(obj) {
    const names = [];

    function recurse(element) {
        if (typeof element === 'object' && element !== null) {
            for (const key in element) {
                if (key === 'name') {
                    names.push(element[key]);
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

    fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term', { // ERROR incomplete JSON IDK why
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
        .then(response => response.json())
        .then(data => {
            try {
                const names = findNames(data); // Extract name s
                // Convert names array to a string for display, e.g., as a list
                const namesList = names.map(name => `<li>${name}</li>`).join('');
                document.getElementById('TopTracks').innerHTML = `<ul>${namesList}</ul>`;
            } catch (e) {
                console.error("Parsing error:", e);
                document.getElementById('TopTracks').innerHTML = "Error parsing JSON data.";
            }
            //document.getElementById('TopTracks').innerHTML = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error(error));

}

