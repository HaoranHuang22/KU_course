
var Simulation = function(target_id, aspect_ratio, target_function, xrange, xdomain=null, ydomain=null, randomize_current=true) {

    this.target = d3.select(target_id + " .placeholder")[0][0];
    this.WIDTH = this.target.offsetWidth;
    this.HEIGHT = aspect_ratio*this.WIDTH;

    this.target_function = target_function;
    // function range(start, stop, step) {
    //     return Array.apply(0, Array((stop-start)/step))
    //         .map(function (element, index) { 
    //             return start + index*step;  
    //         });
    // }

    var margin = {top: 20, right: 20, bottom: 30, left: 50};
    this.width = this.WIDTH - margin.left - margin.right,
    this.height = this.HEIGHT - margin.top - margin.bottom;

    this.x_values = d3.range(xrange[0], xrange[1], xrange[2])
    this.y_values = this.target_function(this.x_values);
    // var start = -4.5;
    // var stop = 4.5;
    // var step = 0.01;
    // var data = new Array((stop-start)/step);
    // for (var i=0; i<data.length; i++) {
    //     data[i] = new Array(2)
    //     data[i][0] = start + i*step;
    // }
    var data = d3.transpose([this.x_values, this.y_values]);
    this.data = data;

    this.x = d3.scale.linear()
        .range([0, this.width]);

    this.y = d3.scale.linear()
        .range([this.height, 0]);    

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .tickFormat("")
        .orient("bottom");
    
    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .tickFormat("")
        .orient("left");

    var that = this;
    this.line = d3.svg.line()
        .x(function(d) { return that.x(d[0]); })
        .y(function(d) { return that.y(d[1]); });    

    this.arrow = function(d) {
        var x0 = that.x(d.x0);
        var y0 = that.y(d.y0)
        var x1 = that.x(d.x1);
        var y1 = that.y(d.y1)
        var y_control_point = y0 - that.y(0.3); 
        // var dx = x1 - x0;
        // var dy = y1 - y0;
        // var dr = Math.sqrt(dx * dx + dy * dy);
        // return "M" + x0 + "," + y0 + "A" + dr + "," + dr + " 0 0,1 " + x1 + "," + y1;
        return "M" + x0 + "," + y0 + " C" + x0 + "," + y_control_point + " " + x1 + "," + y_control_point + " " + x1 + "," + y1;
        // return "M" + x + "," + y + " l" + dx + "," + dy;
        // .x(function(d) { return this.x(d[0]); })
        // .y(function(d) { return this.y(d[1]); });    
    }

    
    if (xdomain == null)
        this.x.domain([d3.min(data, function(d) { return d[0]; }), d3.max(data, function(d) { return d[0]; })]);
    else
        this.x.domain(xdomain)

    if (ydomain == null)
        this.y.domain([d3.min(data, function(d) { return d[1]; }), d3.max(data, function(d) { return d[1]; })*1.5]);
    else
        this.y.domain(ydomain)
    
    this.div = d3.select(target_id + " .placeholder")
        .append('div')
        .style('position', "absolute")
        .style('width', this.WIDTH + "px")
        .style('height', this.HEIGHT + "px")
        .style("margin-left", margin.left + "px")
        .style("margin-top", margin.top + "px");

    this.svg = d3.select(target_id + " .placeholder")
        .append('svg')
        .attr('width', this.WIDTH)
        .attr('height', this.HEIGHT)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis)
        .append("text")
        .attr("transform", "translate(" + this.width + ",0)")
        .attr("dy", "0.75em")
        // .attr("dx", "1.75em")
        .style("text-anchor", "middle")
        .text("x");

    this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis)
        .append("text")
        .attr("dy", "0.5em")
        .attr("dx", "1.75em")
        .style("text-anchor", "end")
        .text("P(x)");
    
    this.svg.append("path")
      .datum(this.data)
      .attr("class", "line")
        .attr("d", this.line);

    this.current = [0., this.target_function(0.)];
    if (randomize_current)
        this.current = this.data[Math.floor(Math.random()*this.data.length)];

    this.svg.append("circle")
        .attr("class", "current")
        .style('fill', 'red')
        .attr('cx', this.x(this.current[0]))
        // .attr('cy', this.y(this.current[1]))
        .attr('cy', this.y(0.))
        .attr('r', 10.);

    this.svg.append("text")
        .attr("class", "label")
        .attr('x', this.x(0.))
        .attr('y', this.y(0.3))
        .text("");

    // this.samples = new Array();
    this.samples = [];
    
    this.hist_bins = this.x.ticks(100);
    this.hist_data = d3.layout.histogram().frequency(false)
        .bins(this.hist_bins)(this.samples);

    this.bin_width = this.hist_data[0].dx;
    for (var i=0; i<this.hist_data.length; i++) {
        this.hist_data[i].y /= this.bin_width;
    }
    
    var bar = this.svg.selectAll(".bar")
        .data(this.hist_data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + that.x(d.x) + "," + that.y(d.y) + ")"; });

    // console.log(this.hist_data[0].x + " " + this.x(this.hist_data[0].dx));
    bar.append("rect")
        .attr("x", 1)
        .attr("width", this.x(this.hist_data[0].x+this.hist_data[0].dx) - this.x(this.hist_data[0].x) -1)
        .attr("height", function(d) { return Math.max(0.,that.height-that.y(d.y)); });    
}

Simulation.prototype.draw_step1 = function(x0, x1) {

    var y0 = this.target_function([x0])[0];
    var y1 = this.target_function([x1])[0];

    var that = this;
    
    this.svg
        .select(".current")
        .attr('cx', this.x(x0))
        .attr('cy', this.y(0.))

    var el;
    el = this.div.selectAll(".x0")
        .data([[x0,0]]);
    el
        .enter()
        .append("div")
        .attr("class", "d3-text x0")
        .text("\\(x_0\\)")
    el // enter + update
        .style('left', function(d) {return ""+that.x(d[0]) + "px"})
        .style('top', function(d) {return ""+that.y(d[1]) + "px"})
        .style('visibility', "hidden")


    el = this.div.selectAll(".x1")
        .data([[x1,0]])
    el
        .enter()
        .append("div")
        .attr("class", "d3-text x1")
        .text("\\(x_1\\)");
    el // enter + update
        .style('left', function(d) {return ""+that.x(d[0]) + "px"})
        .style('top', function(d) {return ""+that.y(d[1]) + "px"})
        .style('visibility', "hidden")

    el = this.div.selectAll(".accept")
        .data([[(x0+x1)/2,-0.05]])
    el
        .enter()
        .append("div")
        .attr("class", "d3-text accept")
        .text("accept?");
    el // enter + update
        .style('left', function(d) {return ""+that.x(d[0]) + "px"})
        .style('top', function(d) {return ""+that.y(d[1]) + "px"})
        .style('visibility', "hidden");
    
    el = this.div.selectAll(".Px0")
        .data([[x0, y0+0.075]]);
    el
        .enter()
        .append("div")
        .attr("class", "d3-text Px0")
        .text("\\(P(x_0)\\)");
    el // enter + update
        .style('left', function(d) {return ""+that.x(d[0]) + "px"})
        .style('top', function(d) {return ""+that.y(d[1]) + "px"})
        .style('visibility', "hidden");
    
    el = this.div.selectAll(".Px1")
        .data([[x1, y1+0.075]])
    el
        .enter()
        .append("div")
        .attr("class", "d3-text Px1")
        .text("\\(P(x_1)\\)");
    el // enter + update
        .style('left', function(d) {return ""+that.x(d[0]) + "px"})
        .style('top', function(d) {return ""+that.y(d[1]) + "px"})
        .style('visibility', "hidden");

    el = this.svg.selectAll(".arrowline")
        .data([{x0:x0, y0:0.01, x1:x1, y1:0.01}])
    el
        .enter()
        .append("path")
        .attr("class", "arrowline");
    el
        .attr("d", this.arrow)
        .attr("marker-end", function(d) { return "url(#arrow)"; })
        .style('visibility', "hidden");
    
}

binomial_coefficient = function(n, k) {
    var prod = 1.;
    for (var i=1; i<=k; i++) {
        prod *= (n + 1 - i)/i;
    }
    return prod;
}

Simulation.prototype.normal_lik = function (x, mu, sigma) {
    return 1.0/Math.sqrt(2*Math.PI*Math.pow(sigma, 2))*Math.exp(-(Math.pow(x-mu, 2)/(2*Math.pow(sigma, 2))))
}

Simulation.prototype.normal_mixture = function (x_values) {
    var y_values = new Array(x_values.length)
    var mu = [-1.5, 0.8, +0.1]
    var sigma = [0.6, 1, 0.2]
    var weights = [0.34, 0.65, 0.02];
    for (var i=0; i<x_values.length; i++) {
        y_values[i] = 0;
        for (var j=0; j<mu.length; j++) {
            y_values[i] += weights[j]*this.normal_lik(x_values[i], mu[j], sigma[j]);
        }
    }
    return y_values;
}

Simulation.prototype.german_tank_posterior1 = function (x_values) {
    var y_values = new Array(x_values.length)
    var max_val = 60;
    var k = 4;
    for (var i=0; i<x_values.length; i++) {
        
        var likelihood = 0.;
        if (x_values[i] > 0) {
            // likelihood = 1./Math.pow(x_values[i], 4);
            likelihood = Math.log(binomial_coefficient(max_val-1, k-1)) - Math.log(binomial_coefficient(x_values[i], k));
        }
        var prior = 1./(1000 - max_val);
        if (x_values[i] < max_val || x_values[i] > 1000) {
            prior = 0.
        }
        y_values[i] = prior*Math.exp(likelihood);
    }
    return y_values;
}

Simulation.prototype.simulate = function(run_simulation=true, max_samples=1E6, histogram_update_freq=1, point_update_freq=1) {

    this.running = run_simulation;
    this.histogram_update_freq = histogram_update_freq;
    this.point_update_freq = point_update_freq;
    this.max_samples = max_samples;

    if (histogram_update_freq > 1) {
        this.svg.select(".label")
            .text("visualize freq: " + histogram_update_freq)
    } else {
        this.svg.select(".label")
            .text("");
    }

    if (this.running)
        repeat(this);

    function repeat(that) {

        var delta = d3.random.normal(0., 1.)();
        // var delta = 1;
        // if (Math.random() > 0.5)
        //     delta *= -1;

        var old_x = that.current[0];
        // console.log(""+old_x);
        var old_y = that.current[1];
        var old_ll = Math.log(old_y);
        
        that.current[0] += delta;
        that.current[1] = that.target_function([that.current[0]]);

        var new_ll = Math.log(that.current[1]);
        var ll_dif = new_ll - old_ll;
        var accept = true;
        if (ll_dif < 0) {
            var d = Math.random();
            if (d > Math.exp(ll_dif)) {
                accept = false;
            }
        }

        if (!accept) {
            that.current[0] = old_x 
            that.current[1] = old_y
        }

        that.samples.push(that.current[0]);

        if (that.max_samples != null && that.samples.length >= that.max_samples)
            that.running = false;

        if ((that.samples.length % that.histogram_update_freq) == 0) {
        
            that.hist_data = d3.layout.histogram().frequency(false)
                .bins(that.hist_bins)(that.samples);

            for (var i=0; i<that.hist_data.length; i++) {
                that.hist_data[i].y /= that.bin_width;
            }

            var bar = that.svg.selectAll(".bar")
                .data(that.hist_data)
                .attr("transform", function(d) { return "translate(" + that.x(d.x) + "," + that.y(d.y) + ")"; });

            var bar_rect = that.svg.selectAll(".bar rect")
                .data(that.hist_data)
                .attr("height", function(d) { return Math.max(0.,that.height-that.y(d.y)); });                
        }

        if ((that.samples.length % that.point_update_freq) == 0) {
        
            that.svg
                .select(".current")
                .transition()
                .duration(10)
                .attr('cx', that.x(that.current[0]))
                // .attr('cy', that.y(that.current[1]))
                .attr('cy', that.y(0.))
                .each("end", function() {if (that.running) repeat(that);});
        } else {
            if (that.running)
                repeat(that);
        }
    }
        
    // for (var i=0; i<10; i++) {

    //     var delta = 0.1;
    //     if (Math.random() > 0.5)
    //         delta *= -1;
        
    //     simulation.current[0] += delta;
    //     simulation.target(simulation.current);

    //     simulation.svg
    //         .select(".current")
    //         .transition()
    //         .duration(750)
    //         .attr('cx', simulation.x(simulation.current[0]))
    //         .attr('cy', simulation.y(simulation.current[1]));
    // }
    
    // var line_selection = simulation.svg.select(".line");

    // simulation.x.domain([d3.min(data, function(d) { return d[0]; }), d3.max(data, function(d) { return d[0]; })]);
    // simulation.y.domain([d3.min(data, function(d) { return d[1]; }), d3.max(data, function(d) { return d[1]; })]); 
    
    // simulation.svg
    //     .select(".line")
    //     .transition()
    //     .duration(750)
    //     .attr("d", simulation.line(data));
    // simulation.svg
    //     .select(".x.axis")
    //     .transition()
    //     .duration(750)
    //     .call(simulation.xAxis);
    // simulation.svg
    //     .select(".y.axis")
    //     .transition()
    //     .duration(750)
    //     .call(simulation.yAxis);
    
    
    // simulation.svg.select('text').text(dataset.year);

    // var circles = simulation.svg
    //     .selectAll('circle')
    // // The unique key is the name.
    //     .data(dataset.people, function(d) { return d.name; });

    // // UPDATE
    // circles
    //     .transition()
    //     .duration(750)
    //     .call(simulation.positionAndSizeCircle)
    // // Necessary in case we switch quickly between data, and some circles started fading out but are not deleted yet.
    // // Then, during the update of the circles, we set it back to the correct opacity.
    // // This is because setting a new transition on an element is cancelling the previous transition.
    //     .style('opacity', 0.5);

    // // ENTER
    // circles
    //     .enter()
    //     .append('circle')
    //     .style('fill', 'black')
    //     .style('opacity', 0)
    //     .call(simulation.positionAndSizeCircle)
    //     .transition()
    //     .duration(750)
    //     .style('opacity', 0.5);

    // // ENTER + UPDATE
    // // Nothing here...

    // // EXIT
    // circles
    //     .exit()
    //     .transition()
    //     .duration(750)
    //     .style('opacity', 0)
    //     .remove();
};

Simulation.prototype.draw_step2 = function(x0, x1) {

    var y0 = simulation.target([x0])[0];
    var y1 = simulation.target([x1])[0];

    var that = this;
    
    // Markers
    this.svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        // .attr("refY", 1.5)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("class", "arrow")
        .attr("d", "M0,-5L10,0L0,5");

    var el;
    
    el = this.svg.selectAll(".Pxline")
        .data([[[x0, 0.01], [x0, y0]], [[x1, 0.01], [x1, y1]]])
    el
        .enter()
        .append("path")
        .attr("class", "line Pxline");
    el
        .style("stroke-dasharray", ("3, 3")) 
        .style("opacity", "0.5") 
        .attr("d", this.line)
        .style('visibility', "hidden");

    
    el = this.svg.selectAll(".Pxcircle")
        .data([[x0, y0], [x1, y1]])
    el
        .enter()
        .append("circle")
        .attr("class", "Pxcircle")
    el
        .style('fill', 'none')
        .attr("cx", function(d) {return that.x(d[0]);})
        .attr("cy", function(d) {return that.y(d[1]);})
        .attr('r', 10.)
        .style('visibility', "hidden");

    
    this.div.selectAll(".x0")
        .style("visibility", "visible")
    this.div.selectAll(".x1")
        .style("visibility", "visible")
    this.div.selectAll(".accept")
        .style("visibility", "visible")
    this.svg.selectAll(".arrowline")
        .style("visibility", "visible")

    this.div.selectAll(".Px0")
        .style("visibility", "hidden")
    this.div.selectAll(".Px1")
        .style("visibility", "hidden")
    
    
    // simulation.div.selectAll(".Pxline")
    //     .style("visibility", "hidden")
    // simulation.div.selectAll(".Pxcircle")
    //     .style("visibility", "hidden")
    
    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x0) + "px")
    //     .style('top', ""+simulation.y(0.) + "px")
    //     .text("\\(x_0\\)");
    
    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x1) + "px")
    //     .style('top', ""+simulation.y(0.) + "px")
    //     .text("\\(x_1\\)");

    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x((x0+x1)/2) + "px")
    //     // .style('top', ""+simulation.y(0.145) + "px")
    //     .style('top', ""+simulation.y(-0.05) + "px")
    //     .text("accept?");
    
}

Simulation.prototype.draw_step3 = function(x0, x1) {

    var y0 = this.target_function([x0])[0];
    var y1 = this.target_function([x1])[0];

    // simulation.svg.append("foreignObject")
    //     .attr("width", 100)
    //     .attr("height", 100)
    //     .attr("x", simulation.x(0.))
    //     .attr("y", simulation.y(-0.035))
    //     .text("\\(x_0\\)");
    // simulation.svg.append("text")
    //     .attr("x", simulation.x(1.))
    //     .attr("y", simulation.y(-0.035))
    //     .attr("text-anchor", "middle")
    //     .text("x1");
    
    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x((x0+x1)/2) + "px")
    //     .style('top', ""+simulation.y(y1+0.15) + "px")
    //     // .text("\\(P(x_1) > P(x_0)\\)? \\(\\begin{cases}true & \\text{if} \\\\ 1 \\text{if} & \\end{cases}\\)");
    //     .text("\\(\\begin{array}{ll}\\text{if\ } P(x_1) > P(x_0): & \\text{ACCEPT} \\\\ \\text{otherwise}: & \\text{ACCEPT}\\end{array}\\)");

    // simulation.div.append("div")
    //     .attr("id", "calculation")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x((x0+x1)/2) + "px")
    //     .style('top', ""+simulation.y((y1+0.2)) + "px")
    //     .text("\\(\\frac{P(x_1)}{P(x_0)}\\)")

    var el;
    
    
    // simulation.svg.append("circle")
    //     .style('fill', 'none')
    //     .attr("class", "highlight-circle")
    //     .attr("cx", simulation.x(x0))
    //     .attr("cy", simulation.y(y0))
    //     .attr('r', 10.);

    // simulation.div.append("div")
    //     .attr("id", "calculation")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x0) + "px")
    //     .style('top', ""+simulation.y((y0+0.075)) + "px")
    //     .text("\\(P(x_0)\\)")
    
    // simulation.svg.append("path")
    //     .datum([[x1, 0.01], [x1, y1]])
    //     .attr("class", "line")
    //     .style("stroke-dasharray", ("3, 3")) 
    //     .style("opacity", "0.5") 
    //     .attr("d", simulation.line);

    // simulation.svg.append("circle")
    //     .style('fill', 'none')
    //     .attr("class", "highlight-circle")
    //     .attr("cx", simulation.x(x1))
    //     .attr("cy", simulation.y(y1))
    //     .attr('r', 10.);

    this.svg.selectAll(".Pxline")
        .style("visibility", "visible")
    this.svg.selectAll(".Pxcircle")
        .style("visibility", "visible")
    
    this.div.selectAll(".Px0")
        .style("visibility", "visible")
    this.div.selectAll(".Px1")
        .style("visibility", "visible")
    
    // simulation.div.append("div")
    //     .attr("id", "calculation")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x1) + "px")
    //     .style('top', ""+simulation.y((y1+0.075)) + "px")
    //     .text("\\(P(x_1)\\)")
    


    // simulation.div.select("#calculation")
    //     .text("\\(\\frac{P(x_1)}{P(x_0)}\\)")
    //     // .text("\\(P(x_1)/P(x_0)\\)")
    
    
}


var simulation = simulation || {};

// simulation.WIDTH = 640;
// simulation.HEIGHT = 480;
simulation.svg = null;

simulation.normal_lik = function (x, mu, sigma) {
    return 1.0/Math.sqrt(2*Math.PI*Math.pow(sigma, 2))*Math.exp(-(Math.pow(x-mu, 2)/(2*Math.pow(sigma, 2))))
}

simulation.target = function (x_values) {
    var y_values = new Array(x_values.length)
    var mu = [-1.5, 0.8, +0.1]
    var sigma = [0.6, 1, 0.2]
    var weights = [0.34, 0.65, 0.02];
    var sum = 0.;
    for (var i=0; i<x_values.length; i++) {
        y_values[i] = 0;
        for (var j=0; j<mu.length; j++) {
            y_values[i] += weights[j]*simulation.normal_lik(x_values[i], mu[j], sigma[j]);
        }
    }
    return y_values;
}

simulation.init = function(target_id, aspect_ratio, randomize_current=true) {

    // // Clear svg
    // if (simulation.svg != null)
    //     simulation.svg.selectAll("*").remove();
    // if (simulation.div != null)
    //     simulation.div.selectAll("*").remove();

    var target = d3.select(target_id + " .placeholder")[0][0];
    simulation.WIDTH = target.offsetWidth;
    simulation.HEIGHT = aspect_ratio*simulation.WIDTH;

    function range(start, stop, step) {
        return Array.apply(0, Array((stop-start)/step))
            .map(function (element, index) { 
                return start + index*step;  
            });
    }

    var margin = {top: 20, right: 20, bottom: 30, left: 50};
    simulation.width = simulation.WIDTH - margin.left - margin.right,
    simulation.height = simulation.HEIGHT - margin.top - margin.bottom;

    simulation.x_values = d3.range(-4.5, 4.5, 0.01)
    simulation.y_values = simulation.target(simulation.x_values);
    // var start = -4.5;
    // var stop = 4.5;
    // var step = 0.01;
    // var data = new Array((stop-start)/step);
    // for (var i=0; i<data.length; i++) {
    //     data[i] = new Array(2)
    //     data[i][0] = start + i*step;
    // }
    var data = d3.transpose([simulation.x_values, simulation.y_values]);
    simulation.data = data;
    // simulation.target(simulation.data);

    simulation.x = d3.scale.linear()
        .range([0, simulation.width]);

    simulation.y = d3.scale.linear()
        .range([simulation.height, 0]);    

    simulation.xAxis = d3.svg.axis()
        .scale(simulation.x)
        // .tickFormat("")
        .orient("bottom");
    
    simulation.yAxis = d3.svg.axis()
        .scale(simulation.y)
        // .tickFormat("")
        .orient("left");
    
    simulation.line = d3.svg.line()
        .x(function(d) { return simulation.x(d[0]); })
        .y(function(d) { return simulation.y(d[1]); });    

    simulation.arrow = function(d) {
        var x0 = simulation.x(d.x0);
        var y0 = simulation.y(d.y0)
        var x1 = simulation.x(d.x1);
        var y1 = simulation.y(d.y1)
        var y_control_point = y0 - simulation.y(0.3); 
        // var dx = x1 - x0;
        // var dy = y1 - y0;
        // var dr = Math.sqrt(dx * dx + dy * dy);
        // return "M" + x0 + "," + y0 + "A" + dr + "," + dr + " 0 0,1 " + x1 + "," + y1;
        return "M" + x0 + "," + y0 + " C" + x0 + "," + y_control_point + " " + x1 + "," + y_control_point + " " + x1 + "," + y1;
        // return "M" + x + "," + y + " l" + dx + "," + dy;
        // .x(function(d) { return simulation.x(d[0]); })
        // .y(function(d) { return simulation.y(d[1]); });    
    }
    
    simulation.x.domain([d3.min(data, function(d) { return d[0]; }), d3.max(data, function(d) { return d[0]; })]);
    simulation.y.domain([d3.min(data, function(d) { return d[1]; }), d3.max(data, function(d) { return d[1]; })*1.5]); 
    
    simulation.div = d3.select(target_id + " .placeholder")
        .append('div')
        .style('position', "absolute")
        .style('width', simulation.WIDTH + "px")
        .style('height', simulation.HEIGHT + "px")
        .style("margin-left", margin.left + "px")
        .style("margin-top", margin.top + "px");

    simulation.svg = d3.select(target_id + " .placeholder")
        .append('svg')
        .attr('width', simulation.WIDTH)
        .attr('height', simulation.HEIGHT)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    simulation.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + simulation.height + ")")
        .call(simulation.xAxis)
        .append("text")
        .attr("transform", "translate(" + simulation.width + ",0)")
        .attr("dy", "0.75em")
        // .attr("dx", "1.75em")
        .style("text-anchor", "middle")
        .text("x");

    simulation.svg.append("g")
        .attr("class", "y axis")
        .call(simulation.yAxis)
        .append("text")
        .attr("dy", "0.5em")
        .attr("dx", "1.75em")
        .style("text-anchor", "end")
        .text("P(x)");
    
    simulation.svg.append("path")
      .datum(simulation.data)
      .attr("class", "line")
        .attr("d", simulation.line);

    simulation.current = [0., simulation.target(0.)];
    if (randomize_current)
        simulation.current = simulation.data[Math.floor(Math.random()*simulation.data.length)];

    simulation.svg.append("circle")
        .attr("class", "current")
        .style('fill', 'red')
        .attr('cx', simulation.x(simulation.current[0]))
        // .attr('cy', simulation.y(simulation.current[1]))
        .attr('cy', simulation.y(0.))
        .attr('r', 10.);

    simulation.svg.append("text")
        .attr("class", "label")
        .attr('x', simulation.x(0.))
        .attr('y', simulation.y(0.3))
        .text("");

    // simulation.samples = new Array();
    simulation.samples = [];
    
    simulation.hist_bins = simulation.x.ticks(100);
    simulation.hist_data = d3.layout.histogram().frequency(false)
        .bins(simulation.hist_bins)(simulation.samples);

    simulation.bin_width = simulation.hist_data[0].dx;
    for (var i=0; i<simulation.hist_data.length; i++) {
        simulation.hist_data[i].y /= simulation.bin_width;
    }
    
    var bar = simulation.svg.selectAll(".bar")
        .data(simulation.hist_data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + simulation.x(d.x) + "," + simulation.y(d.y) + ")"; });

    // console.log(simulation.hist_data[0].x + " " + simulation.x(simulation.hist_data[0].dx));
    bar.append("rect")
        .attr("x", 1)
        .attr("width", simulation.x(simulation.hist_data[0].x+simulation.hist_data[0].dx) - simulation.x(simulation.hist_data[0].x) -1)
        .attr("height", function(d) { return Math.max(0.,simulation.height-simulation.y(d.y)); });    

};

simulation.draw_step1 = function(x0, x1) {

    var y0 = simulation.target([x0])[0];
    var y1 = simulation.target([x1])[0];

    simulation.svg
        .select(".current")
        .attr('cx', simulation.x(x0))
        .attr('cy', simulation.y(0.))

    var el;
    el = simulation.div.selectAll(".x0")
        .data([[x0,0]]);
    el
        .enter()
        .append("div")
        .attr("class", "d3-text x0")
        .text("\\(x_0\\)")
    el // enter + update
        .style('left', function(d) {return ""+simulation.x(d[0]) + "px"})
        .style('top', function(d) {return ""+simulation.y(d[1]) + "px"})
        .style('visibility', "hidden")


    el = simulation.div.selectAll(".x1")
        .data([[x1,0]])
    el
        .enter()
        .append("div")
        .attr("class", "d3-text x1")
        .text("\\(x_1\\)");
    el // enter + update
        .style('left', function(d) {return ""+simulation.x(d[0]) + "px"})
        .style('top', function(d) {return ""+simulation.y(d[1]) + "px"})
        .style('visibility', "hidden")

    el = simulation.div.selectAll(".accept")
        .data([[(x0+x1)/2,-0.05]])
    el
        .enter()
        .append("div")
        .attr("class", "d3-text accept")
        .text("accept?");
    el // enter + update
        .style('left', function(d) {return ""+simulation.x(d[0]) + "px"})
        .style('top', function(d) {return ""+simulation.y(d[1]) + "px"})
        .style('visibility', "hidden");
    
    el = simulation.div.selectAll(".Px0")
        .data([[x0, y0+0.075]]);
    el
        .enter()
        .append("div")
        .attr("class", "d3-text Px0")
        .text("\\(P(x_0)\\)");
    el // enter + update
        .style('left', function(d) {return ""+simulation.x(d[0]) + "px"})
        .style('top', function(d) {return ""+simulation.y(d[1]) + "px"})
        .style('visibility', "hidden");
    
    el = simulation.div.selectAll(".Px1")
        .data([[x1, y1+0.075]])
    el
        .enter()
        .append("div")
        .attr("class", "d3-text Px1")
        .text("\\(P(x_1)\\)");
    el // enter + update
        .style('left', function(d) {return ""+simulation.x(d[0]) + "px"})
        .style('top', function(d) {return ""+simulation.y(d[1]) + "px"})
        .style('visibility', "hidden");

    el = simulation.svg.selectAll(".arrowline")
        .data([{x0:x0, y0:0.01, x1:x1, y1:0.01}])
    el
        .enter()
        .append("path")
        .attr("class", "arrowline");
    el
        .attr("d", simulation.arrow)
        .attr("marker-end", function(d) { return "url(#arrow)"; })
        .style('visibility', "hidden");
    
}

simulation.draw_step2 = function(x0, x1) {

    var y0 = simulation.target([x0])[0];
    var y1 = simulation.target([x1])[0];
    
    // Markers
    simulation.svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        // .attr("refY", 1.5)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("class", "arrow")
        .attr("d", "M0,-5L10,0L0,5");

    var el;
    
    el = simulation.svg.selectAll(".Pxline")
        .data([[[x0, 0.01], [x0, y0]], [[x1, 0.01], [x1, y1]]])
    el
        .enter()
        .append("path")
        .attr("class", "line Pxline");
    el
        .style("stroke-dasharray", ("3, 3")) 
        .style("opacity", "0.5") 
        .attr("d", simulation.line)
        .style('visibility', "hidden");

    
    el = simulation.svg.selectAll(".Pxcircle")
        .data([[x0, y0], [x1, y1]])
    el
        .enter()
        .append("circle")
        .attr("class", "Pxcircle")
    el
        .style('fill', 'none')
        .attr("cx", function(d) {return simulation.x(d[0]);})
        .attr("cy", function(d) {return simulation.y(d[1]);})
        .attr('r', 10.)
        .style('visibility', "hidden");

    
    simulation.div.selectAll(".x0")
        .style("visibility", "visible")
    simulation.div.selectAll(".x1")
        .style("visibility", "visible")
    simulation.div.selectAll(".accept")
        .style("visibility", "visible")
    simulation.svg.selectAll(".arrowline")
        .style("visibility", "visible")

    simulation.div.selectAll(".Px0")
        .style("visibility", "hidden")
    simulation.div.selectAll(".Px1")
        .style("visibility", "hidden")
    
    
    // simulation.div.selectAll(".Pxline")
    //     .style("visibility", "hidden")
    // simulation.div.selectAll(".Pxcircle")
    //     .style("visibility", "hidden")
    
    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x0) + "px")
    //     .style('top', ""+simulation.y(0.) + "px")
    //     .text("\\(x_0\\)");
    
    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x1) + "px")
    //     .style('top', ""+simulation.y(0.) + "px")
    //     .text("\\(x_1\\)");

    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x((x0+x1)/2) + "px")
    //     // .style('top', ""+simulation.y(0.145) + "px")
    //     .style('top', ""+simulation.y(-0.05) + "px")
    //     .text("accept?");
    
}

simulation.draw_step3 = function(x0, x1) {

    var y0 = simulation.target([x0])[0];
    var y1 = simulation.target([x1])[0];

    // simulation.svg.append("foreignObject")
    //     .attr("width", 100)
    //     .attr("height", 100)
    //     .attr("x", simulation.x(0.))
    //     .attr("y", simulation.y(-0.035))
    //     .text("\\(x_0\\)");
    // simulation.svg.append("text")
    //     .attr("x", simulation.x(1.))
    //     .attr("y", simulation.y(-0.035))
    //     .attr("text-anchor", "middle")
    //     .text("x1");
    
    // simulation.div.append("div")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x((x0+x1)/2) + "px")
    //     .style('top', ""+simulation.y(y1+0.15) + "px")
    //     // .text("\\(P(x_1) > P(x_0)\\)? \\(\\begin{cases}true & \\text{if} \\\\ 1 \\text{if} & \\end{cases}\\)");
    //     .text("\\(\\begin{array}{ll}\\text{if\ } P(x_1) > P(x_0): & \\text{ACCEPT} \\\\ \\text{otherwise}: & \\text{ACCEPT}\\end{array}\\)");

    // simulation.div.append("div")
    //     .attr("id", "calculation")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x((x0+x1)/2) + "px")
    //     .style('top', ""+simulation.y((y1+0.2)) + "px")
    //     .text("\\(\\frac{P(x_1)}{P(x_0)}\\)")

    var el;
    
    
    // simulation.svg.append("circle")
    //     .style('fill', 'none')
    //     .attr("class", "highlight-circle")
    //     .attr("cx", simulation.x(x0))
    //     .attr("cy", simulation.y(y0))
    //     .attr('r', 10.);

    // simulation.div.append("div")
    //     .attr("id", "calculation")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x0) + "px")
    //     .style('top', ""+simulation.y((y0+0.075)) + "px")
    //     .text("\\(P(x_0)\\)")
    
    // simulation.svg.append("path")
    //     .datum([[x1, 0.01], [x1, y1]])
    //     .attr("class", "line")
    //     .style("stroke-dasharray", ("3, 3")) 
    //     .style("opacity", "0.5") 
    //     .attr("d", simulation.line);

    // simulation.svg.append("circle")
    //     .style('fill', 'none')
    //     .attr("class", "highlight-circle")
    //     .attr("cx", simulation.x(x1))
    //     .attr("cy", simulation.y(y1))
    //     .attr('r', 10.);

    simulation.svg.selectAll(".Pxline")
        .style("visibility", "visible")
    simulation.svg.selectAll(".Pxcircle")
        .style("visibility", "visible")
    
    simulation.div.selectAll(".Px0")
        .style("visibility", "visible")
    simulation.div.selectAll(".Px1")
        .style("visibility", "visible")
    
    // simulation.div.append("div")
    //     .attr("id", "calculation")
    //     .attr("class", "d3-text")
    //     .style('left', ""+simulation.x(x1) + "px")
    //     .style('top', ""+simulation.y((y1+0.075)) + "px")
    //     .text("\\(P(x_1)\\)")
    


    // simulation.div.select("#calculation")
    //     .text("\\(\\frac{P(x_1)}{P(x_0)}\\)")
    //     // .text("\\(P(x_1)/P(x_0)\\)")
    
    
}

simulation.update = function(run_simulation=true, max_samples=1E6, histogram_update_freq=1, point_update_freq=1) {

    simulation.running = run_simulation;
    simulation.histogram_update_freq = histogram_update_freq;
    simulation.point_update_freq = point_update_freq;
    simulation.max_samples = max_samples;

    if (histogram_update_freq > 1) {
        simulation.svg.select(".label")
            .text("visualize freq: " + histogram_update_freq)
    } else {
        simulation.svg.select(".label")
            .text("");
    }

    if (simulation.running)
        repeat();

    function repeat() {

        var delta = d3.random.normal(0., 1.)();
        // var delta = 1;
        // if (Math.random() > 0.5)
        //     delta *= -1;

        var old_x = simulation.current[0];
        var old_y = simulation.current[1];
        var old_ll = Math.log(old_y);
        
        simulation.current[0] += delta;
        simulation.current[1] = simulation.target([simulation.current[0]]);

        var new_ll = Math.log(simulation.current[1]);
        var ll_dif = new_ll - old_ll;
        var accept = true;
        if (ll_dif < 0) {
            var d = Math.random();
            if (d > Math.exp(ll_dif)) {
                accept = false;
            }
        }

        if (!accept) {
            simulation.current[0] = old_x 
            simulation.current[1] = old_y
        }

        simulation.samples.push(simulation.current[0]);

        if (simulation.max_samples != null && simulation.samples.length >= simulation.max_samples)
            simulation.running = false;

        if ((simulation.samples.length % simulation.histogram_update_freq) == 0) {
        
            simulation.hist_data = d3.layout.histogram().frequency(false)
                .bins(simulation.hist_bins)(simulation.samples);

            for (var i=0; i<simulation.hist_data.length; i++) {
                simulation.hist_data[i].y /= simulation.bin_width;
            }

            var bar = simulation.svg.selectAll(".bar")
                .data(simulation.hist_data)
                .attr("transform", function(d) { return "translate(" + simulation.x(d.x) + "," + simulation.y(d.y) + ")"; });

            var bar_rect = simulation.svg.selectAll(".bar rect")
                .data(simulation.hist_data)
                .attr("height", function(d) { return Math.max(0.,simulation.height-simulation.y(d.y)); });                
        }

        if ((simulation.samples.length % simulation.point_update_freq) == 0) {
        
            simulation.svg
                .select(".current")
                .transition()
                .duration(10)
                .attr('cx', simulation.x(simulation.current[0]))
                // .attr('cy', simulation.y(simulation.current[1]))
                .attr('cy', simulation.y(0.))
                .each("end", function() {if (simulation.running) repeat();});
        } else {
            if (simulation.running)
                repeat();
        }
    }
        
    // for (var i=0; i<10; i++) {

    //     var delta = 0.1;
    //     if (Math.random() > 0.5)
    //         delta *= -1;
        
    //     simulation.current[0] += delta;
    //     simulation.target(simulation.current);

    //     simulation.svg
    //         .select(".current")
    //         .transition()
    //         .duration(750)
    //         .attr('cx', simulation.x(simulation.current[0]))
    //         .attr('cy', simulation.y(simulation.current[1]));
    // }
    
    // var line_selection = simulation.svg.select(".line");

    // simulation.x.domain([d3.min(data, function(d) { return d[0]; }), d3.max(data, function(d) { return d[0]; })]);
    // simulation.y.domain([d3.min(data, function(d) { return d[1]; }), d3.max(data, function(d) { return d[1]; })]); 
    
    // simulation.svg
    //     .select(".line")
    //     .transition()
    //     .duration(750)
    //     .attr("d", simulation.line(data));
    // simulation.svg
    //     .select(".x.axis")
    //     .transition()
    //     .duration(750)
    //     .call(simulation.xAxis);
    // simulation.svg
    //     .select(".y.axis")
    //     .transition()
    //     .duration(750)
    //     .call(simulation.yAxis);
    
    
    // simulation.svg.select('text').text(dataset.year);

    // var circles = simulation.svg
    //     .selectAll('circle')
    // // The unique key is the name.
    //     .data(dataset.people, function(d) { return d.name; });

    // // UPDATE
    // circles
    //     .transition()
    //     .duration(750)
    //     .call(simulation.positionAndSizeCircle)
    // // Necessary in case we switch quickly between data, and some circles started fading out but are not deleted yet.
    // // Then, during the update of the circles, we set it back to the correct opacity.
    // // This is because setting a new transition on an element is cancelling the previous transition.
    //     .style('opacity', 0.5);

    // // ENTER
    // circles
    //     .enter()
    //     .append('circle')
    //     .style('fill', 'black')
    //     .style('opacity', 0)
    //     .call(simulation.positionAndSizeCircle)
    //     .transition()
    //     .duration(750)
    //     .style('opacity', 0.5);

    // // ENTER + UPDATE
    // // Nothing here...

    // // EXIT
    // circles
    //     .exit()
    //     .transition()
    //     .duration(750)
    //     .style('opacity', 0)
    //     .remove();
};
