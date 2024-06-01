var pieWidth = 200;
var pieHeight = 200;
var radius = Math.min(pieWidth, pieHeight) / 2;

var color = d3.scale.ordinal()
    .range(["rgba(192, 108, 132, 1)", "rgba(246, 114, 128, 1)", "rgba(53, 92, 125, 1)"]);

var pie = d3.layout.pie()
    .value(function(d) { return d.values; });

var arc = d3.svg.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

var pieSvg = d3.select("#pie-chart")
    .append("svg")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
    .append("g")
    .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")");

var legend = d3.select("#pie-chart").append("ul")
    .attr("class", "legend");

d3.json("unesco.json", function(error, data) {
    if (error) throw error;

    updatePieChart(2023);  
});

function updatePieChart(year, selectedCountry = null) {
    d3.json("unesco.json", function(error, data) {
        if (error) throw error;

        var filteredData = data.filter(function(d) {
            return d.date_inscribed <= year && (!selectedCountry || d.country_name.includes(selectedCountry));
        });

        var culturalCounts = d3.nest()
            .key(function(d) { return d.category_long; })
            .rollup(function(leaves) { return leaves.length; })
            .entries(filteredData);

        var totalCulturalSites = d3.sum(culturalCounts, function(d) { return d.values; });
        culturalCounts.forEach(function(d) {
            d.percent = (d.values / totalCulturalSites) * 100;
        });

        var pieData = pie(culturalCounts);

        var pieChart = pieSvg.selectAll(".arc")
            .data(pieData);

        pieChart.enter()
            .append("g")
            .attr("class", "arc")
            .append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.data.key); });

        pieChart.select("path")
            .transition()
            .duration(500)
            .attr("d", arc)
            .style("fill", function(d) { return color(d.data.key); });

        pieChart.exit().remove();

        var legendItems = legend.selectAll(".legend-item")
            .data(culturalCounts);

        var newLegendItems = legendItems.enter().append("li")
            .attr("class", "legend-item");

        newLegendItems.append("span")
            .attr("class", "legend-color")
            .style("background-color", function(d) { return color(d.key); });

        newLegendItems.append("span")
            .text(function(d) { return d.key + " - " + d.percent.toFixed(2) + "%"; });

        legendItems.select("span.legend-color")
            .style("background-color", function(d) { return color(d.key); });

        legendItems.select("span:not(.legend-color)")
            .text(function(d) { return d.key + " - " + d.percent.toFixed(2) + "%"; });

        legendItems.exit().remove();
    });
}
