// fornt end code for the spotify API (index.js)
// Parse the URL to get the access token if it's there
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

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

    fetch('https://api.spotify.com/v1/me/top/artists', { // I dont think the scope is updated after a login
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('TopTracks').innerHTML = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error(error)); // unexpeded end of json error here!!!!

}