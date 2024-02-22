import {fetchStats} from "./jsMain.js";
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const accessToken = urlParams.get('access_token');

fetchStats(accessToken, 'https://api.spotify.com/v1/me/top/artists?limit=5&time_range=long_term',
    'name', 'item-container', true);// need the element Id
//fetchStats(accessToken, 'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=long_term',
 //   'followers', 'artist-followers', true);

