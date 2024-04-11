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

// https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
function normalcdf(mean, sigma, to) 
{
    var z = (to-mean)/Math.sqrt(2*sigma*sigma);
    var t = 1/(1+0.3275911*Math.abs(z));
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
    var sign = 1;
    if(z < 0)
    {
        sign = -1;
    }
    return (1/2)*(1+sign*erf);
}

const mojo_fns = [
    (data) => {
	// we just want the average std_deviation
	var std_dev_total = 0;
	var cnt = 0;
	for (ds of data) {
	    for (val in ds) {
		if (val === "tempo") {
		    ds[val].std_deviation /= ds[val].max;
		}
		std_dev_total += ds[val].std_deviation;
		cnt += 1;
	    }
	}
	return Math.sqrt(std_dev_total / cnt);
    },
    (data) => {
	var data_sets = [data[0], data[1], data[2], data[2]];
	var diff_sets = [data[1], data[2], data[0], data[1]];
	var i = 0;
	for (d of data_sets) {
	    for (val in d) {
		if (val == "tempo") {
		    d[val].mean /= 300; // some random value
		}
		diff_sets[i][val].mean -= d[val].mean;
		diff_sets[i][val].mean = Math.abs(diff_sets[i][val].mean);
	    }
	    i += 1;
	}
	var val = 0;
	for (d of diff_sets) {
	    for (dd in d) {
		val += d[dd].mean;
	    }
	}	
	return Math.sqrt(val / (6 * i));
    },
    (data) => {
	var avg_valence = 0;
	var avg_valence_std_dev = 0;
	var cnt = 0;
	for (ds of data) {
	    avg_valence += ds.valence.mean;
	    cnt += 1;
	}
	avg_valence /= cnt;
	return normalcdf(0.8, 0.2, avg_valence);
    },
    (data) => {
	var avg_valence = 0;
	var cnt = 0;
	for (ds of data) {
	    avg_valence += ds.valence.mean;
	    cnt += 1;
	}
	avg_valence /= cnt;
	return normalcdf(0.8, 0.2, 1.0 - avg_valence);
    },
    (data) => {
	var avg_energy = 0;
	var avg_danceability = 0;
	var cnt = 0;
	for (ds of data) {
	    avg_energy += ds.energy.mean;
	    avg_danceability += ds.danceability.mean;
	    cnt += 1;
	}
	avg_energy /= cnt;
	avg_danceability /= cnt;

	return (normalcdf(0.8, 0.15, avg_energy) + normalcdf(0.8, 0.15, avg_danceability)) / 2;
    },
    (data) => {
	var avg_instr = 0;
	var cnt = 0;
	for (ds of data) {
	    avg_instr += ds.instrumentalness.mean;
	    cnt += 1;
	}
	avg_instr /= cnt;
	return normalcdf(0.75, 0.15, avg_instr);
    },
    (data) => {
	var avg_bpm = 0;
	var cnt = 0;
	for (ds of data) {
	    avg_bpm += ds.tempo.mean;
	    cnt += 1;
	}
	avg_bpm /= cnt;
	return normalcdf(240, 50, avg_bpm);
    },
    (data) => {
	var avg_bpm = 0;
	var avg_valence = 0;
	var cnt = 0;
	for (ds of data) {
	    avg_bpm += ds.tempo.mean;
	    avg_valence += ds.valence.mean;
	    cnt += 1;
	}
	avg_bpm /= cnt;
	avg_valence /= cnt;
	return (normalcdf(240, 50, 300 - avg_bpm) + normalcdf(0.8, 0.15, 1.0 - avg_valence)) / 2;
    }
];

const mojo_names = [
    "Experimentalist",
    "Chaos",
    "Optimist",
    "Realist",
    "Raver",
    "Vocal Hater",
    "GenZ",
    "Gloomer"
];

const mojo_descriptions = [
    "You listen to a variety of songs in different genres. You find it hard to settle on a favourite and love to try new things.",
    "Your listening taste changes rapidly over time. You move between genres and artists quickly and your taste develops with each new listen.",
    "You love to listen to happy songs, which reflect your attitude to life. Their energy helps revitalise you and ready you for another day of slop.",
    "You love to listen songs which reflect your situation. You always draw the short end of the stick, and you feel the need to remind yourself of that fact when listening.",
    "You love to dance to your spotify tracks. Your top songs have clean tempos and high energy to make you feel alive when you are rotting alone in your room.",
    "Your listening has a strong emphasis on instrumentals because you hate the thought that people can sing better than you so avoid songs like the plague.",
    "You listen to extremely high BPM songs because you need something that rivals your energy. Please calm down and get off tiktok.",
    "You listen to lots of low energy, sad songs. Your playlist is full of songs that make you want to sit in bed and think about crying."
];

const mojo_short_descriptions = [
    "You listen to a variety of songs in different genres.",
    "Your listening habits change a lot with time.",
    "You listen to happy songs.",
    "You listen to depressing songs.",
    "You listen to high-energy dance songs.",
    "You listen to a lot of instrumentals.",
    "You listen to a lot of high-BPM songs.",
    "You listen to low BPM, sad songs."
];

// generates some "class" of listener based on a simple analysis of the 
function calc_mojo(stats_data, unique_score) {
    // transform mean of tempo back to real values
    var data = structuredClone(stats_data);
    for (d of data) {
	d.tempo.mean *= 300;
    }

    var st_mojo = {score: 0};
    var nd_mojo = {score: 0};
    var rd_mojo = {score: 0};
    var i = 0;
    for (fn of mojo_fns) {
	var score = fn(structuredClone(data));
	if (score > rd_mojo.score) {
	    if (score > nd_mojo.score) {
		if (score > st_mojo.score) {
		    rd_mojo = nd_mojo;
		    nd_mojo = st_mojo;
		    st_mojo = {score: score, idx: i};
		} else {
		    rd_mojo = nd_mojo;
		    nd_mojo = {score: score, idx: i};
		}
	    } else {
		rd_mojo = {score: score, idx: i};
	    }
	}
	i += 1;
    }
    return `
<div id="mojo-box">
<h2>The ${mojo_names[st_mojo.idx]}</h2>
<p>${mojo_descriptions[st_mojo.idx]}</p>
<h3>The ${mojo_names[nd_mojo.idx]}</h3>
<p>${mojo_short_descriptions[nd_mojo.idx]}</p>
<h3>The ${mojo_names[rd_mojo.idx]}</h3>
<p>${mojo_short_descriptions[rd_mojo.idx]}</p>
<div>
<h2>${Math.round(unique_score * 100)}%</h2>
<p>Your uniqueness score calculated by our advanced algorithms</p>
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


