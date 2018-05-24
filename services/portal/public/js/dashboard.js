function gatherLabels(items) {
  return items.map(item => `${item._id.day}/${item._id.month}/${item._id.year}`);
}

function gatherData(items) {
  return items.map(item => item.count);
}

function createGraph(dataset, label, color) {
  return {
		label: label,
		borderColor: color,
		backgroundColor: color,
		fill: false,
		data: gatherData(dataset),
		yAxisID: 'y-axis-1',
	};
}

let chartColors = [
  'rgb(255, 99, 132)',
	'rgb(255, 159, 64)',
  'rgb(75, 192, 192)',
  'rgb(54, 162, 235)',
	'rgb(255, 205, 86)',
	'rgb(153, 102, 255)',
	'rgb(201, 203, 207)'
];

window.onload = function() {
  let i = 0;
	var ctx = document.getElementById('canvas').getContext('2d');
  var lineChartData = {
  	labels: [],
  	datasets: []
  };

  for(axis in digitalData) {
    let graph = createGraph(digitalData[axis], axis.toUpperCase(), chartColors[i++] );
    let labels = gatherLabels(digitalData[axis]);
    lineChartData.datasets.push(graph);
    lineChartData.labels = labels;
  }

	window.myLine = Chart.Line(ctx, {
		data: lineChartData,
		options: {
			responsive: true,
			hoverMode: 'index',
			stacked: false,
			title: {
				display: true,
				text: 'Funnel'
			},
			scales: {
				yAxes: [{
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'left',
					id: 'y-axis-1',
				}, {
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					id: 'y-axis-2',

					// grid line settings
					gridLines: {
						drawOnChartArea: false, // only want the grid lines for one axis to show up
					},
				}],
			}
		}
	});
};
