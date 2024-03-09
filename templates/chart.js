const stats = document.getElementById("stats-radar-chart");
Chart.defaults.color = '#ffffff';
Chart.defaults.font.size = 14;
Chart.defaults.font.weight = "bold";
new Chart(stats, {
    type: 'radar',
    data: {
	labels: [<%labels%>],
	datasets: [
		<%datasets%>
	],
    },
    options: {
	responsive: true,
	//events: [],
	plugins: {
	    tooltip: {
		display: false,
		events: []
	    },
	},
	scales: {
	    r: {
		suggestedMin: 0,
		suggestedMax: 1,
		ticks: {
		    display: false,
		    maxTicksLimit: 4
		},
		angleLines: {
		    color: 'rgb(255, 255, 255, 0.25)',
		    //          display: false
		},
		grid: {
		    color: 'rgb(255, 255, 255, 0.25)',
		}
	    },
	},
    },
});
