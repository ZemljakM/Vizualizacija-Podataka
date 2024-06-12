var width = document.getElementById('map-container').clientWidth * 0.99;
var height = window.innerHeight * 0.85;

var projection = d3.geo.mercator()
    .scale(width / 7)
    .translate([width / 2, height / 1.5]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

var div = d3.select("#tooltip");

var zoom = d3.behavior.zoom()
    .on("zoom", function () {
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        g.selectAll(".unesco-site")
            .attr("r", 2.5 / d3.event.scale);
    });
svg.call(zoom);

d3.json("world.json", function(error, world) {
    if (error) throw error;

    var countries = topojson.feature(world, world.objects.countries);

    g.selectAll(".country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .style("fill", "white")
        .style("stroke", "#d6d5d6")
        .style("stroke-width", 0.5)
        .on("mouseover", function(d) {
            d3.select(this).style("fill", "rgba(192, 108, 132, 1)");
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.properties.name)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select(this).style("fill", "white");
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(d) {
            var countryName = d.properties.name;
            var year = document.getElementById('year-slider').value;
            updateCountrySites(countryName, d3.select("#year-slider").node().value);
            filterDataByCountry(countryName, year);
            updatePieChart(year, countryName);
            updateBarChart(year, countryName);
            setTimeout(function() {
                d3.select("#country-select").property("selectedIndex", 0);
                filterDataByYear(year);
                updateBarChart(year);
                updatePieChart(year);
            }, 15000);
        });

    
    d3.json("unesco.json", function(error, data) {
        if (error) throw error;

        var countries = Array.from(new Set(data.map(d => d.country_name.split(',')).flat()));
        countries.sort();
        
        var select = d3.select("#country-select");
        countries.forEach(function(country) {
            select.append("option")
                .attr("value", country)
                .text(country);
        });

        filterDataByYear(2023);
    });
});



function showSiteInfo(site) {
    var overlay = d3.select("#overlay");
    var overlayContent = d3.select("#overlay-content");

    overlayContent.html(
        "<p><strong>Name:</strong> <span id='info-name'>" + site.Name + "</span></p>" +
        "<p><strong>Description:</strong> <span id='info-description'>" + site.short_description + "</span></p>" +
        "<p><strong>Year:</strong> <span id='info-year'>" + site.date_inscribed + "</span></p>" +
        "<p><strong>Danger:</strong> <span id='info-danger'>" + (site.danger === "1" ? "Yes" : "No") + "</span></p>" +
        "<p><strong>Category:</strong> <span id='info-category'>" + site.category_long + "</span></p>" +
        "<p><strong>Country:</strong> <span id='info-country'>" + site.country_name + "</span></p>"
    );

    overlay.style("display", "block")
        .transition()
        .duration(1000)
        .style("opacity", 1);

    setTimeout(function() {
        overlay.transition()
            .duration(1000)
            .style("opacity", 0)
            .each("end", function() {
                overlay.style("display", "none");
            });
    }, 10000);
}


function updateCountrySites(country, year) {
    d3.json("unesco.json", function(error, data) {
        if (error) throw error;

        var filteredData = data.filter(function(d) {
            return d.date_inscribed <= year && d.country_name.includes(country);
        });

        var siteNames = filteredData.map(function(d) {
            return d.Name;
        });

        var overlay = d3.select("#overlay");
        var overlayContent = d3.select("#overlay-content");

        overlayContent.html( siteNames.map(function(site) {
            return '<li>' + site + '</li>';
        }).join('') + '</ul>');

        overlay.style("display", "block")
            .transition()
            .duration(1000)
            .style("opacity", 1);

        
        setTimeout(function() {
            overlay.transition()
                .duration(1000)
                .style("opacity", 0)
                .each("end", function() {
                    overlay.style("display", "none");
                });
        }, 10000);
    });
}


function filterDataByYear(year) {
    d3.json("unesco.json", function(error, data) {
        if (error) throw error;

        var filteredData = data.filter(function(d) {
            return d.date_inscribed <= year;
        });

        g.selectAll(".unesco-site").remove();
        g.selectAll(".unesco-site")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "unesco-site")
            .attr("cx", function(d) { return projection([parseFloat(d.longitude), parseFloat(d.latitude)])[0]; })
            .attr("cy", function(d) { return projection([parseFloat(d.longitude), parseFloat(d.latitude)])[1]; })
            .attr("r", 2.5)
            .style("fill", function(d) { return d.danger === "1" ? "maroon" : "#002D62";})
            .style("stroke-width", 0.3)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(d.Name)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(d) {
                showSiteInfo(d);
            });
    });
}


function filterDataByCountry(country, year) {
    d3.json("unesco.json", function(error, data) {
        if (error) throw error;

        var filteredData = data.filter(function(d) {
            return d.country_name.split(',').includes(country) && d.date_inscribed <= year;
        });

        g.selectAll(".unesco-site").remove();
        g.selectAll(".unesco-site")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "unesco-site")
            .attr("cx", function(d) { return projection([parseFloat(d.longitude), parseFloat(d.latitude)])[0]; })
            .attr("cy", function(d) { return projection([parseFloat(d.longitude), parseFloat(d.latitude)])[1]; })
            .attr("r", 2.5)
            .style("fill", function(d) { return d.danger === "1" ? "maroon" : "#002D62";})
            .style("stroke", "black")
            .style("stroke-width", 0.3)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(d.Name)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
    });
}

    


    