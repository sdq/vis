let scatterplotMatrix = function(eventProxy) {
    let scatterplotMatrix = {},
        size = [500, 500],
        margin = {
            left: 10,
            top: 10,
            right: 10,
            bottom: 10
        },
        container = null,
        data = {},
        properties = {

        },
        dimensions = new Map(),
        slots = {
            "X": vis.slot().name("X").description("X value").isMultiple(true).isRequired(true),
            "Y": vis.slot().name("Y").description("Y value").isMultiple(true).isRequired(true),
            "Color": vis.slot().name("Color").description("node color").dataTypes(["Categorical", "Numerical"]),
            "Size": vis.slot().name("Size").description("node size"),
            "Shape": vis.slot().name("Shape").description("node shape").dataTypes(["Categorical"]),
            "Tooltip": vis.slot().name('Tooltip').description('Tooltip value').isMultiple(true).dataTypes(["Categorical", "Numerical"])
        },
        mappings = new Map(),
        isRendered = false;

    // Private Parameters
    let color = d3.scaleOrdinal(vis.colorCategory12a),
        colorLinear = [vis.color.LightBlue, vis.color.DeepBlue],
        shape = d3.scaleOrdinal(d3.symbols);

    scatterplotMatrix.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return scatterplotMatrix;
    };

    scatterplotMatrix.container = function(_) {
        if (!arguments.length) return container;
        container = d3.select(_);
        return scatterplotMatrix;
    };

    scatterplotMatrix.data = function(_) {
        if (!arguments.length) return data;
        data = _[0] || [];
        return scatterplotMatrix;
    };

    scatterplotMatrix.dimensions = function(_) {
        if (!arguments.length) return dimensions;
        let input = _;
        for (let i = 0; i < input.length; i++) {
            dimensions.set(input[i].name(), input[i]);
        }
        return scatterplotMatrix;
    };

    scatterplotMatrix.slots = function() {
        return slots;
    };

    scatterplotMatrix.isReady = function() {
        // check ready or not
        if ((mappings.get("X") && mappings.get("X").length) || (mappings.get("Y") && mappings.get("Y").length)) {
            return true;
        }
        return false;
    };

    scatterplotMatrix.isRendered = function() {
        return isRendered;
    }

    scatterplotMatrix.render = function() {
        if (!container) {
            return;
        };
        // render
        container.selectAll('.container').remove();
        // create svg
        let svg = container.append('svg')
            .attr('class', 'container')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 ' + size[0] + ' ' + size[1]);
        // .style("display", "none")

        let w = size[0] - margin.left - margin.right,
            h = size[1] - margin.top - margin.bottom;

        // create the rendering pannel  
        svg.append('g')
            .attr('class', 'canvas')
            .attr('id', 'canvas')
            .attr('width', w)
            .attr('height', h)
            .attr('transform', 'translate(' + (margin.left) + ',' + margin.top + ')');

        isRendered = false;

        if (scatterplotMatrix.isReady())
            return scatterplotMatrix.update();
        else return scatterplotMatrix;
    };

    scatterplotMatrix.layout = function() {
        // layout
        return scatterplotMatrix;
    };

    scatterplotMatrix.mapping = function(_) {
        if (!arguments.length) return mappings;
        let newMappings = _;

        mappings.clear();
        for (let fieldName in newMappings) {
            if (newMappings.hasOwnProperty(fieldName)) {
                mappings.set(fieldName, newMappings[fieldName]);
            }
        }
        return scatterplotMatrix;
    };

    scatterplotMatrix.properties = function(_) {
        if (!arguments.length) return properties;
        properties = _;
        return scatterplotMatrix;
    };

    scatterplotMatrix.save = function() {
        let copyProperties = vis.clone(properties);
        return {
            "properties": copyProperties
        }
    };

    let dispatch = d3.dispatch('zoom', 'pan');

    scatterplotMatrix.update = function() {
        clearCanvas();

        let slotX = mappings.get("X") || [],
            slotY = mappings.get("Y") || [],
            slotColor = mappings.get("Color") || [],
            slotSize = mappings.get("Size") || [],
            slotShape = mappings.get("Shape") || [],
            slotTooltip = mappings.get("Tooltip") || [];

        data = vis.filterAbnormity(data, [slotX, slotY, slotColor, slotSize, slotShape, slotTooltip]);

        // elements
        const canvas = container.select('#canvas');
        let chartHeight = canvas.attr('height') - 160,
            chartWidth = canvas.attr('width') - 160;
        if (!slotColor.length && !slotShape.length) { //no legend
            chartWidth += 100,
                chartHeight += 100;
        }
        const chartG = canvas.append('g')
            .attr('transform', `translate(25, ${(canvas.attr("height") - chartHeight) / 2 - 15})`);

        // data
        const dataG = chartG.append('g');
        let traitsX = slotX.length ? slotX : slotY,
            traitsY = slotY.length ? slotY : slotX.map( d => d);
        traitsY.reverse();
        //size
        let maxLength = Math.max(traitsX.length, traitsY.length);
        let sizeScale;
        if (slotSize.length)
            sizeScale = d3.scaleLinear()
                .domain(dimensions.get(slotSize[0]).extent())
                .range([30 / maxLength, chartHeight / 4 / maxLength]);

        let symbol = d3.symbol().size(chartHeight / 8 / maxLength);
        const shapeValue = slotShape.length ? d => d[slotShape] : d => 0;

        let padding = 30,
            size = (Math.min(chartWidth, chartHeight)) / maxLength;
        const xScale = d3.scaleLinear()
            .range([padding / 2, size - padding / 2]);
        const yScale = d3.scaleLinear()
            .range([size - padding / 2, padding / 2]);
        let xAxis = d3.axisBottom()
            .scale(xScale)
            .ticks(5)
            .tickPadding(5)
            .tickSize(size - padding);
        let yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(5)
            .tickPadding(5)
            .tickSize(-size + padding);
        let cells = dataG.selectAll('.cell')
            .data(cross(traitsX, traitsY))
            .enter().append('g')
            .attr('class', 'cell')
            .attr('id', function(d, i) {
                return "cell-" + i;
            })
            .attr('transform', function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
            .each(drawPlot);
        
        //label
        chartG.append('g')
            .attr('transform', `translate(0, ${traitsY.length * size})`)
            .selectAll('text')
            .data(traitsX).enter()
            .append('text')
            .attr('class', 'axis-label')
            .attr('x', (d, i) => size * i + size / 2 - padding)
            .attr('y', 15)
            .text(d => d);
        
        chartG.append('g')
            .selectAll('text')
            .data(traitsY).enter()
            .append('text')
            .attr('class', 'axis-label')
            .attr('transform', `rotate(-90)`)
            .attr('x', (d, i) => - size * (i + 1) + size / 2 )
            .attr('y', -25)
            .style('text-anchor', 'middle')
            .text(d => d);
        
        function drawPlot(p) {
            let cell = d3.select(this);

            xScale.domain(dimensions.get(p.x).extent());
            yScale.domain(dimensions.get(p.y).extent());

            cell.selectAll('circle')
                .data(data)
                .enter().append('path')
                .attr("class", "point")
                .style('fill-opacity', 0)
                .style('fill', '#ccc')
                .style('stroke-opacity', 0.8)
                .attr("stroke-width", 2)
                .style("stroke", vis.color.Blue)
                .attr('transform', function (d) {
                    return 'translate(' + xScale(d[p.x]) + ', ' + yScale(d[p.y]) + ')';
                })
                .on("mouseover", function (d) {
                    d3.select(this).style("fill-opacity", 1);
                    let str = "";
                    let showList = new Set();
                    slotX.forEach(function (s) {
                        showList.add(s);
                    });
                    slotY.forEach(function (s) {
                        showList.add(s);
                    });
                    if (slotColor.length) showList.add(slotColor[0]);
                    if (slotSize.length) showList.add(slotSize[0]);
                    if (slotShape.length) showList.add(slotShape[0]);
                    slotTooltip.forEach(function (s) {
                        showList.add(s);
                    });
                    showList.forEach(function (d0) {
                        str += d0 + ": " + d[d0] + "<br>";
                    });
                    vis.displayHoverTip(container, str);
                })
                .on("mouseout", function () {
                    d3.select(this).style("fill-opacity", 0);
                    vis.removeHoverTip(container);
                });
            
            //axis x
            cell.append('g')
                .attr('class', 'xAxis')
                .attr('transform', "translate(" + 0 + "," + padding / 2 + ")")
                .call(xAxis);
            //axis y
            cell.append('g')
                .attr('class', 'yAxis')
                .attr('transform', "translate(" + padding / 2 + "," + 0 + ")")
                .call(yAxis);     
        }

        function cross(a, b) {
            let c = [],
                n = a.length,
                m = b.length,
                i, j;
            for (i = -1; ++i < n;)
                for (j = -1; ++j < m;) c.push({ x: a[i], i: i, y: b[j], j: j });
            return c;
        }

        if (slotSize.length)
                cells.selectAll('.point').attr('d', function (d) {
                    symbol.type(shape(shapeValue(d))).size(sizeScale(d[slotSize]));
                    return symbol();
                });
            else {
                cells.selectAll('.point').attr('d', function (d) {
                    symbol.type(shape(shapeValue(d)));
                    return symbol();
                });
            }
        
        // legend
        let legendY = 10;
        let colorLegendG;
        if (slotColor.length) {
            let colorType = dimensions.get(slotColor[0]).dataType();
            let colorLabel = slotColor[0];
            colorLegendG = chartG.append('g')
                .attr('transform', `translate(${chartWidth + 20}, ${legendY})`);

            if (colorType === "Numerical") {
                let extent = dimensions.get(slotColor[0]).extent();
                let linear = d3.scaleLinear()
                    .domain(extent)
                    .range([0, 1]);
                let computeColor = d3.interpolate(d3.rgb(colorLinear[0]), d3.rgb(colorLinear[1]));
                cells.selectAll('.point').style("stroke", d => computeColor(linear(d[slotColor])));
                colorLegendG.append("text")
                    .attr("class", "legendTitle")
                    .text(colorLabel);
                let group = colorLegendG.append("g").attr('transform', `translate(0, 25)`);
                let gradientW = 80,
                    gradientH = 15;
                let defs = group.append('defs');
                let linearGradient = defs.append('linearGradient')
                    .attr('id', 'linearColor')
                    .attr('x1', '0%')
                    .attr('y1', '0%')
                    .attr('x2', '100%')
                    .attr('y2', '0%');
                linearGradient.append('stop')
                    .attr('offset', '0%')
                    .style('stop-color', colorLinear[0]);
                linearGradient.append('stop')
                    .attr('offset', '100%')
                    .style('stop-color', colorLinear[1]);
                group.append('rect')
                    .attr('width', gradientW)
                    .attr('height', gradientH)
                    .attr("opacity", 0.8)
                    .style('fill', 'url(#' + linearGradient.attr('id') + ')');
                group.append('text')
                    .attr('class', 'valueText')
                    .attr('dy', '-0.4em')
                    .style('fill', "#8E8883")
                    .style('font-size', "10px")
                    .style('text-anchor', "middle")
                    .style('font-family', 'sans-serif')
                    .text(extent[0]);
                group.append('text')
                    .attr('class', 'valueText')
                    .attr('x', gradientW)
                    .attr('dy', '-0.4em')
                    .style('fill', "#8E8883")
                    .style('font-size', "10px")
                    .style('text-anchor', "middle")
                    .text(extent[1]);
                legendY += 65;
            } else if (colorType === "Categorical") {
                cells.selectAll('.point').style("stroke", d => color(d[slotColor]));

                let colorDomain = dimensions.get(slotColor[0]).extent(),
                    colorRange = colorDomain.map(d => color(d));
                let colorScale = d3.scaleOrdinal()
                    .domain(colorDomain)
                    .range(colorRange);
                const colorLegend = d3.legendColor()
                    .scale(colorScale)
                    .shape('circle')
                    .shapeRadius(5)
                    .shapePadding(-2)
                    .title(colorLabel);
                colorLegendG.call(colorLegend);
                legendY += 16 * (colorRange.length + 1) + 22;
            }
        }

        if (slotShape.length) {
            const shapeLegendG = chartG.append('g')
                .attr('transform', `translate(${chartWidth + 20}, ${legendY})`);

            let symbolDomain = dimensions.get(slotShape[0]).extent(),
                symbolRange = symbolDomain.map(d => d3.symbol().type(shape(d))());
            let symbolScale = d3.scaleOrdinal()
                .domain(symbolDomain)
                .range(symbolRange);
            const shapeLegend = d3.legendSymbol()
                .scale(symbolScale)
                .shapePadding(-2)
                .title(slotShape[0]);
            shapeLegendG.call(shapeLegend);
            let paths = shapeLegendG.selectAll('.legendCells path');
            if (slotColor.length) {
                if (slotColor[0] == slotShape[0]) {
                    legendY = 10;
                    colorLegendG.remove();
                    shapeLegendG.attr('transform', `translate(${chartWidth + 40}, ${legendY})`);
                    paths.each(function(d) {
                        d3.select(this).attr("fill", color(d));
                    });
                } else paths.attr("fill", 'rgb(171,171,171)');
            } else paths.attr("fill", vis.color.Blue).style("opacity", 0.8);
        }


        // STYLE
        chartG.selectAll('.domain')
            .style('stroke', '#C0C0BB');
        chartG.selectAll('.tick line')
            .style('stroke-width', '0.5')
            .style('stroke', '#C0C0BB');
        chartG.selectAll('.tick text')
            .style('fill', '#8E8883')
            .style('font-size', '8px')
            .style('font-family', 'sans-serif');
        chartG.selectAll('.axis-label')
            .style('fill', '#635F5D')
            .style('font-size', '10px')
            .style('font-family', 'sans-serif');
        chartG.selectAll('.legendCells text')
            .style('fill', '#8E8883')
            .style('font-size', '10px')
            .style('font-family', 'sans-serif');
        chartG.selectAll(".legendTitle")
            .style("fill", "#635F5D")
            .style("font-size", "12px")
            .style("font-family", "sans-serif");


        return scatterplotMatrix;
    }

    scatterplotMatrix.clear = function(json) {
        if (container) {
            container.html('');
        }
        //
        dimensions.clear();
        data = {};
        mappings.clear();

        //atcion

        size = [500, 500];
        margin = {
            left: 10,
            top: 10,
            right: 10,
            bottom: 10
        };
        isRendered = false;
        return scatterplotMatrix;
    }

    scatterplotMatrix.operate = function(json) {
        // process actionJson
        switch (json.taxonomy) {
            case 'Visual Exploration':
                // visualActions
                vis.eventHandle(eventProxy, json);
                return visualActions[json.type](json.parameters);
            case 'Insight':
                // insightActions
                return insightActions[json.type](json.parameters);
            default:
                break
        }
    }

    let visualActions = {
        'Mapping': function(parameters) {
            // Mapping
            switch (parameters.operation) {
                case 'Add':
                    return addMapping(parameters.slot, parameters.dimension);
                case 'Remove':
                    return removeMapping(parameters.slot, parameters.dimension);
                default:
                    break
            }
        },
        'Zoom': function(parameters) {
            // Zoom
            return zoom(parameters.start, parameters.end);
        },
        'Pan': function(parameters) {
            // Pan
            return pan(parameters.offset);
        },
        'Inspect': function(parameters) {
            // Inspect
            return inspect();
        },
        'Brush': function(parameters) {
            // Brush
            return brush();
        },
        'Restore': function(parameters) {
            // Restore
            return restore(parameters.mapping, parameters.state);
        }
    }

    let insightActions = {
        'Snapshot': function(parameters) {
            return snapshot();
        },
        'Save': function(parameters) {
            // Save
            return saveState();
        },
        'Bookmark': function(parameters) {
            // Bookmark
            return saveState(parameters.note);
        }
    }

    let addMapping = function(slot, dimension) {
        // if add successfully, return true
        let s = slots[slot],
            d = dimensions.get(dimension);

        if (!s || !(s.dataTypes().indexOf(d.dataType()) + 1)) {
            console.error('Slot dismiss!');
            return false;
        }

        let ds = mappings.get(slot) || [];
        if (s.isMultiple()) {
            if (ds.indexOf(dimension) == -1)
                ds.push(dimension);
            mappings.set(slot, ds);
        } else {
            mappings.set(slot, [dimension]);
        }

        if (scatterplotMatrix.isReady()) {
            scatterplotMatrix.update();
        } else {
            clearCanvas();
        }
        return true;
    }

    let removeMapping = function(slot, dimension) {
        if (mappings.has(slot) && mappings.get(slot).length) {
            let d = mappings.get(slot),
                i = d.indexOf(dimension);

            if (i > -1) {
                d.splice(i, 1);
                if (scatterplotMatrix.isReady()) {
                    scatterplotMatrix.update();
                } else { // clear canvas
                    clearCanvas();
                }
                return true;
            }
        }
        return false;
    }

    let zoom = function(s, e) {

    }

    let pan = function(o) {

    }

    let inspect = function(nodeId) {}

    let brush = function() {}

    let snapshot = function() {
        return container.select('.container').node().outerHTML;
    }

    let saveState = function(note) {
        let svg;
        if (!note) { // save
            if (scatterplotMatrix.isReady())
                svg = container.select('.container').node().outerHTML;
        }
        let parameters = {
            'note': note,
            'svg': svg,
            'mapping': JSON.parse(MapTOJson(mappings)),
            'state': {

            }
        }
        return JSON.stringify(parameters);
    }

    let restore = function(mapping, state) {
        // mappings
        mappings.clear();
        for (let slot in mapping) {
            mappings.set(slot, mapping[slot]);
        }
        if (scatterplotMatrix.isReady()) {
            scatterplotMatrix.update();
        } else {
            clearCanvas();
        }
        return saveState();
    }

    // //////////////////////////////////////////////
    //
    //

    function clearCanvas() {
        container.select('#canvas').html('');
    }

    function MapTOJson(m) {
        let str = '{';
        let i = 1;
        m.forEach(function(items, key, mapObj) {
            str += '"' + key + '":[';
            items.forEach(function(item, index) {
                str += '"' + item + '"';
                if (index < items.length - 1) str += ',';
            })
            str += ']';
            if (mapObj.size != i) str += ',';
            i++;
        })
        str += '}';
        return str;
    }

    return scatterplotMatrix;
}