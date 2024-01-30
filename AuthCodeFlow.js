// accsessing the spotify API - fetching user token

var client_id = 'CLIENT_ID';
var redirect_uri = 'http://localhost:8888/callback'; // ocne the user has been athorized, the user will be
// redirected to this url (this should be either the same page or just take them straight to the main
// page of the app)

var app = express();

// Redirect to Spotify's authentication page
app.get('/login', function(req, res) {
    var scopes = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + client_id +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

// Callback route
app.get('/callback', function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };
    }
});

// we need to compare the state param recived and then reject the flow if there is a mismatch

// below is the Code to revice the JSON

async function getProfile(accessToken) {
   // let accessToken = localStorage.getItem('access_token');

    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    });

    const data = await response.json();
}
