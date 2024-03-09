const templ = require("./templates/index.js");
const fs = require("fs");

var stats_page_template = null;
var chart_js_template = null;
var dataset_js_template = null;

function stats_page() {
    return structuredClone(stats_page_template);
}

function chart() {
    return structuredClone(chart_js_template);
}

function dataset() {
    return structuredClone(dataset_js_template);
}

function init() {
    const stats_page_html = fs.readFileSync("./templates/stats_page.html").toString();
    stats_page_template = templ.parse(stats_page_html);

    const chart_js = fs.readFileSync("./templates/chart.js").toString();
    chart_js_template = templ.parse(chart_js);

    const dataset_js = fs.readFileSync("./templates/dataset.js").toString();
    dataset_js_template = templ.parse(dataset_js);
}

function build_top_n_component(data, template, subs_fn) {
    var out_html = "";
    var i = 0;
    for (item of data) {
	out_html += templ.subs_all(structuredClone(template), subs_fn(item));
	i += 1;
    }
    return out_html;
}

function top_n_songs(songs_list, n) {
    const songs = songs_list.slice(0, Math.min(songs_list.length, n));
    songs.sort((a, b) => { return a.ranking - b.ranking; });
    const template = templ.parse(`
<div class="song-item">
  <p><%ranking%></p>
  <div>
    <p><%artist_names%></p>
    <h2><%song_name%></h2>
  </div>
</div>
`);
    return "<div class=\"draggable songs-list\">\n" +
	build_top_n_component(songs, template, function (x) {
	    return {
		ranking: x.ranking.toString(),
		artist_names: x.artists.map(a => a.name).join(", "),
		song_name: x.name
	    };
	}) + "</div>";
}

function top_n_artists(artists_list, n) {
    const artists = artists_list.slice(0, Math.min(artists_list.length, n));
    artists.sort((a, b) => { return a.ranking - b.ranking; });
    const template = templ.parse(`
<div class="song-item">
  <p><%ranking%></p>
  <div>
    <h2><%artist_name%></h2>
  </div>
</div>
`);
    return "<div class=\"draggable songs-list\">\n" +
	build_top_n_component(artists, template, function (x) {
	    return {
		ranking: x.ranking.toString(),
		artist_name: x.name
	    };
	}) + "</div>";
}


// generates some "class" of listener based on a simple analysis of the 
function calc_mojo(stats_data) {
    console.log(stats_data.filter((e, i) => i == 0));
    return `
<div id="mojo-box">
<h2>The MOJO</h2>
<p>Some vague description referencing a lot of things
that have nothing to do with music but sound vaguely
related to create the sense that any real thought was put
into the process of generating this title.</p>
<h3>The 2nd MOJO</h3>
<p>Shorter text summarizing this one</p>
<h3>The 3rd MOJO</h3>
<p>As well as the same for this one</p>
<div>
<h2>50%</h2>
<p>Confident that the next coin you toss will be heads</p>
</div>
</div>
`;
}

module.exports = {
    init,
    templ,
    stats_page,
    chart,
    dataset,
    top_n_songs,
    top_n_artists,
    calc_mojo
};


