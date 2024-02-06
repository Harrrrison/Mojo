// fornt end code for the spotify API (index.js)
// Parse the URL to get the access token if it's there
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

if (accessToken) {
    // Use the access token to make API requests
    // accsess token seems to be working but we need to figure out how to get the user dataa
    fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('data').innerHTML = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error(error, JSON.stringify(data, null, 2)));
}
