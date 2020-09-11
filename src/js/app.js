import template from '../templates/template.html'
import Ractive from 'ractive'
import * as d3 from "d3"

function init(country, data) {

	function numberFormat(num) {
        if ( num > 0 ) {
            if ( num > 1000000000 ) { return ( num / 1000000000 ) + 'bn' }
            if ( num > 1000000 ) { return ( num / 1000000 ) + 'm' }
            if ( num > 1000 ) { return ( num / 1000 ) + 'k' }
            if (num % 1 != 0) { return num.toFixed(2) }
            else { return num.toLocaleString() }
        }
        if ( num < 0 ) {
            var posNum = num * -1;
            if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 )) + 'bn'];
            if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 )) + 'm'];
            if ( posNum > 1000 ) return ["-" + String(( posNum / 1000 )) + 'k'];
            else { return num.toLocaleString() }
        }
        return num;
    }

	function niceNumber(num) {
		return parseInt(num.replace(/,/g, ""))
	}

	function sorter(a,b) {
		if (a > b) {
			return -1;
		}
		if (b > a) {
			return 1;
		}		
		return 0;
	}

	function compare(things) {
		return [].slice.call(things).sort(sorter)[0]
	}

	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	var isMobile = (windowWidth < 610) ? true : false ;

	var format = d3.format(",")

	Ractive.DEBUG = false;
	
	var ractive = new Ractive({
			target: "#outer-wrapper",
			template: template,
			data: { 
				location:data[country],
				layout: "two",
				label: "Confirmed cases",
				ausManualTimestamp:data["Australia"].timestamp,
				autoTimestamp:data["US"].timestamp
			}
		});


	ractive.on({
		world: function ( event ) {
			ractive.set('location', data["World"])
			ractive.set('layout', "two")
			ractive.set('label', "Confirmed cases")
			country = 'World'
			d3.selectAll(".btn").classed("btn-selected", false);
			d3.select(".world").classed("btn-selected", true);
			drawChart(data["World"].data, "Total");
		},
		us: function ( event ) {
			console.log("us")
			ractive.set('location', data["US"])
			ractive.set('layout', "two")
			ractive.set('label', "Confirmed cases")
			country = 'US'
			d3.selectAll(".btn").classed("btn-selected", false);
			d3.select(".us").classed("btn-selected", true);
			drawChart(data["US"].data, "Total");
		},
		uk: function ( event ) {
			console.log("uk")
			ractive.set('location', data["United Kingdom"])
			ractive.set('layout', "two")
			ractive.set('label', "Confirmed cases")
			country = 'United Kingdom'
			d3.selectAll(".btn").classed("btn-selected", false);
			d3.select(".uk").classed("btn-selected", true);
			drawChart(data["United Kingdom"].data, "Total");
		},
		aus: function ( event ) {
			console.log("aus")
			ractive.set('location', data["Australia"])
			ractive.set('layout', "two")
			ractive.set('label', "Active cases*")
			country = 'Australia'
			d3.selectAll(".btn").classed("btn-selected", false);
			d3.select(".aus").classed("btn-selected", true);
			drawChart(data["Australia"].data, "Total");
		}
	});

	function drawChart(data, country) {

		var width = document.querySelector("#barChart").getBoundingClientRect().width
		var height = 200			
		var margin
		var dateParse = d3.timeParse('%Y-%m-%d');

		margin = {top: 10, right: 10, bottom: 20, left:40}
		width = width - margin.left - margin.right,
    	height = height - margin.top - margin.bottom

    	d3.select("#barChart svg").remove();

    	var barChart = d3.select("#barChart").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("id", "barChartSvg")
				.attr("overflow", "hidden")					

		var features = barChart.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		data.forEach(function(d) {
			if (typeof d[country] == 'string') {
				d[country] = +d[country];
			}
		
			if (typeof d.index == 'string') {
				d.index = dateParse(d.index);
			}
			

		})

		var x = d3.scaleBand().range([0, width]).paddingInner(0.08);
    	var y = d3.scaleLinear().range([height, 0]);

		x.domain(data.map(function(d) { return d.index; }))

		y.domain(d3.extent(data, function(d) { return d[country]; }))
		
		var xAxis;
		var yAxis;

		var ticks = x.domain().filter(function(d,i){ return !(i%Math.round(x.domain().length / 10)); } );

		if (isMobile) {
			ticks = x.domain().filter(function(d,i){ return !(i%Math.round(x.domain().length / 5)); } );
		}	

		if (isMobile) {
			xAxis = d3.axisBottom(x).tickValues(ticks).tickFormat(d3.timeFormat("%b %d"))
			yAxis = d3.axisLeft(y).tickFormat(function (d) { return numberFormat(d)}).ticks(5).tickSize(-width)
		}

		else {
			xAxis = d3.axisBottom(x).tickValues(ticks).tickFormat(d3.timeFormat("%b %d"))
			yAxis = d3.axisLeft(y).tickFormat(function (d) { return numberFormat(d)}).ticks(5).tickSize(-width)
		}

		features.append("g")
				.attr("class","x")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

		features.append("g")
			.attr("class","y grid")
			.call(yAxis)

		features.selectAll(".bar")
	    	.data(data)
			    .enter().append("rect")
				.attr("class", "bar")
				.attr("x", function(d) { return x(d.index) })
				.style("fill", function(d) {
						return "rgb(204, 10, 17)"
				})
				.attr("y", function(d) { 
					return y(Math.max(d[country], 0))
					// return y(d[keys[0]]) 
				})
				.attr("width", x.bandwidth())
				.attr("height", function(d) { 
					return Math.abs(y(d[country]) - y(0))
				});

	}

	drawChart(data["World"].data, "Total");

	var to=null
	var lastWidth = document.querySelector("#barChart").getBoundingClientRect()

	window.addEventListener('resize', function() {
		var thisWidth = document.querySelector("#barChart").getBoundingClientRect()
		if (lastWidth != thisWidth) {
			window.clearTimeout(to);
			to = window.setTimeout(function() {
				console.log("Resize")
				    drawChart(data[country].data, "Total");
				}, 100)
		}
	
	})

};

function api() {

	Promise.all([
		d3.json('https://interactive.guim.co.uk/2020/09/covid-feeds/updated-covid-feed.json')
	])
	.then((results) =>  {
		init('World', results[0])
	})

}

api();

setInterval(function(){ api(); }, 1800000);
