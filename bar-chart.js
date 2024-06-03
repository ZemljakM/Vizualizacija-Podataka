d3.json("unesco.json", function(error, data) {
    if (error) throw error;

    updateBarChart(2023);  
});


function updateBarChart(year, selectedCountry = null) {
    d3.json("unesco.json", function(error, data) {
        if (error) throw error;

        var filteredData = data.filter(function(d) {
            return d.date_inscribed <= year && (!selectedCountry || d.country_name.includes(selectedCountry));
        });

        var barChartData;

        if (!selectedCountry) {
            var countryCounts = d3.nest()
                .key(function(d) { return d.country_name; })
                .rollup(function(leaves) { return leaves.length; })
                .entries(filteredData);

            countryCounts.sort(function(a, b) {
                return d3.descending(a.values, b.values);
            });
            barChartData = countryCounts.slice(0, 5);
            console.log(barChartData);
        } else {
            var dangerCount = filteredData.filter(function(d) {
                return d.danger === "1";
            }).length;

            var safeCount = filteredData.length - dangerCount;

            barChartData = [
                { key: "In danger", values: dangerCount },
                { key: "Not in danger", values: safeCount }
            ];
        }

        d3.select("#bar-chart").selectAll("*").remove();

        var margin = { top: 20, right: 50, bottom: 30, left: 80 };
        var width = 400 - margin.left - margin.right;
        var height = 200 - margin.top - margin.bottom;

        var barColor = d3.scale.ordinal()
            .range(["rgba(53, 92, 125, 1)", "rgba(122, 100, 129, 1)" , "rgba(192, 108, 132, 1)", "rgba(221, 111, 130, 1)", "rgba(246, 114, 128, 1)"]);

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1)
            .domain(barChartData.map(function(d) { return d.key; }));

        var y = d3.scale.linear()
            .range([height, 0])
            .domain([0, d3.max(barChartData, function(d) { return d.values; })]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickValues(d3.range(0, d3.max(barChartData, function(d) { return d.values; }) + 1, 10));

        var svg = d3.select("#bar-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right - 50)
            .attr("height", height + margin.top + margin.bottom + 80)
            .append("g")
            .attr("transform", "translate(" + ((width + margin.left) / 2 - width / 2) + "," + ((height + margin.top) / 2 - height / 2) + ")");


        svg.selectAll(".bar")
            .data(barChartData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.key); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.values); })
            .attr("height", function(d) { return height - y(d.values); })
            .attr("fill", function(d, i) { return barColor(i); });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-55)");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.selectAll(".bar")
            .append("title")
            .text(function(d) { return d.values; });

    
    });
}
