let linechart = function (eventProxy) {
    let linechart = {},
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
            "domain": null // zoom and pan domain
        },
        dimensions = new Map(),
        slots = {
            'X': vis.slot().name('X').description('X value').isRequired(true),
            'Y': vis.slot().name('Y').description('Y value').isRequired(true),
            'Color': vis.slot().name("Color").description("line color").dataTypes(["Categorical"]),
            "Tooltip": vis.slot().name('Tooltip').description('Tooltip value').isMultiple(true).dataTypes(["Categorical", "Numerical"])
        },
        mappings = new Map(),
        isRendered = false;

    // Private Parameters
    let color = d3.scaleOrdinal(vis.colorCategory12a);

    linechart.margin = function (_) {
        if (!arguments.length) return margin;
        margin = _;
        return linechart;
    };

    linechart.container = function (_) {
        if (!arguments.length) return container;
        container = d3.select(_);
        return linechart;
    };

    linechart.data = function (_) {
        if (!arguments.length) return data;
        data = _[0] || [];
        return linechart;
    };

    linechart.dimensions = function (_) {
        if (!arguments.length) return dimensions;
        let input = _;
        for (let i = 0; i < input.length; i++) {
            dimensions.set(input[i].name(), input[i]);
        }
        return linechart;
    };

    linechart.slots = function () {
        return slots;
    };

    linechart.isReady = function () {
        // check ready or not
        if ((mappings.get('X') && mappings.get('X').length) && (mappings.get('Y') && mappings.get('Y').length)) {
            return true;
        }
        return false;
    };

    linechart.isRendered = function() {
        return isRendered;
    }

    let dispatch = d3.dispatch('zoom', 'pan');

    linechart.layout = function () {
        // layout
        return linechart;
    };

    linechart.render = function() {
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
            .attr('transform', 'translate(' + (margin.left + 80) + ',' + margin.top + ')');

        isRendered = false;

        if (linechart.isReady())
            return linechart.update();
        else return linechart;
    };

    linechart.update = function () {
        clearCanvas();

        let slotX = mappings.get('X'),
            slotY = mappings.get('Y'),
            slotColor = mappings.get('Color') || [],
            slotTooltip = mappings.get('Tooltip') || [];

        data = vis.filterAbnormity(data, [slotX, slotY, slotColor, slotTooltip]);

        // elements
        const canvas = container.select('#canvas');
        let chartHeight = canvas.attr('height') - 180,
            chartWidth = canvas.attr('width') - 180;
        if (!slotColor.length) { //no legend
            chartWidth += 60,
                chartHeight += 60;
        }
        const chartG = canvas.append('g')
            .attr('transform', `translate(-15, ${(canvas.attr("height") - chartHeight) / 2 - 40})`);

        chartG.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', chartWidth)
            .attr('height', chartHeight);

        // data
        const dataG = chartG.append('g')
            .attr('clip-path', 'url(#clip)');
        // axis x
        const xAxisG = chartG.append('g')
            .attr('transform', `translate(0, ${chartHeight})`);
        const xScale = d3.scaleLinear()
            .domain(dimensions.get(slotX[0]).extent())
            .range([0, chartWidth])
            .nice(); // neat function name!
        const xAxis = d3.axisBottom()
            .scale(xScale)
            .ticks(5)
            .tickPadding(15)
            .tickSize(-chartHeight);
        // axis y
        const yAxisG = chartG.append('g')
        const yScale = d3.scaleLinear()
            .domain(dimensions.get(slotY[0]).extent())
            .range([chartHeight, 0])
            .nice();
        const yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(5)
            .tickPadding(8)
            .tickSize(-chartWidth);

        // data
        let line = d3.line();

        let countData = [];
        let extentColor = ["default"];
        if (!slotColor.length) {
            countData = [data];
        } else {
            extentColor = dimensions.get(slotColor[0]).extent();
            extentColor.forEach(function (c) {
                let d0 = data.filter(function (d) {
                    if (d[slotColor] === c) return true;
                    return false;
                });
                countData.push(d0);
            });
        }

        xAxisG.call(xAxis);
        let rotate = false;
        let tickText = xAxisG.call(xAxis)
            .selectAll('.tick text')
            .each(function (d) {
                if (this.getComputedTextLength() > 60)
                    rotate = true
            });
        if (rotate)
            tickText.attr('transform', 'translate(14,14) rotate(45)');

        yAxisG.call(yAxis);

        // legend
        if (slotColor.length) {
            let legendY = 10;
            const colorLegendG = chartG.append('g')
                .attr('transform', `translate(${chartWidth + 40}, ${legendY})`);
            let colorDomain = extentColor,
                colorRange = colorDomain.map(d => color(d));
            let colorScale = d3.scaleOrdinal()
                .domain(colorDomain)
                .range(colorRange);
            const colorLegend = d3.legendColor()
                .scale(colorScale)
                .shape('circle')
                .shapeRadius(5)
                .shapePadding(-2)
                .title(slotColor[0]);
            colorLegendG.call(colorLegend);
        }

        // brush and zoom
        const actionG = canvas.append('g')
            .attr('transform', `translate(-15, ${(canvas.attr("height") - chartHeight) / 2 + chartHeight})`);
        const brushHeight = 8;

        // axis x
        let xScale2 = d3.scaleLinear()
            .domain(xScale.domain())
            .range([0, chartWidth])
            .nice(); // neat function name!
        const xAxis2 = d3.axisBottom(xScale2).ticks(5)
        const xAxisG2 = actionG.append('g')
            .attr('transform', `translate(0, ${brushHeight})`)
            .call(xAxis2);
        let brush = d3.brushX()
            .extent([
                [0, 0],
                [chartWidth, brushHeight]
            ])
            .on('brush', brushing)
            .on('end', brushend);
        let brushG = actionG.append('g')
            .attr('class', 'brush');

        dispatch
            .on('zoom', function () {
                let d = this.detail;
                if (d3.event && d3.event.type == 'end') return;
                if (d.start > d.end || d.end <= xScale2.domain()[0] || d.start >= xScale2.domain()[1]) return;
                if (d.start == d.end) brushG.call(brush.move, [Math.max(xScale2.range()[0], xScale2(d.start) - 1), Math.min(xScale2.range()[1], xScale2(d.end) + 1)]);
                else brushG.call(brush.move, [Math.max(xScale2.range()[0], xScale2(d.start)), Math.min(xScale2.range()[1], xScale2(d.end))]);
            })
            .on('pan', function () {
                if (d3.event && d3.event.type == 'end') return;
                if (!properties.domain) properties.domain = xScale2.domain();
                let offset = this.detail.offset;
                let s = [properties.domain[0] + offset, properties.domain[1] + offset];
                if (s[0] < xScale2.domain()[0]) {
                    s = [xScale2.domain()[0], s[1] + xScale2.domain()[0] - s[0]];
                } else if (s[1] > xScale2.domain()[1]) {
                    s = [s[0] + xScale2.domain()[1] - s[1], xScale2.domain()[1]];
                }
                if (s[0] == s[1]) brushG.call(brush.move, [xScale2(s[0]) - 1, xScale2(s[1]) + 1]);
                else brushG.call(brush.move, [xScale2(s[0]), xScale2(s[1])]);
            });

        let handle = brushG.selectAll('.handle--custom')
            .data([{ type: 'w' }, { type: 'e' }])
            .enter().append('circle')
            .attr('class', 'handle--custom')
            .attr('r', brushHeight / 2)
            .attr('fill', '#AAA')
            .attr('fill-opacity', 0.8)
            .attr('stroke', '#888')
            .attr('stroke-width', 1.5)
            .attr('cursor', 'ew-resize');

        if (!properties.domain) properties.domain = xScale2.domain();
        if (properties.domain[0] == properties.domain[1]) brushG.call(brush).call(brush.move, [xScale2(properties.domain[0]) - 1, xScale2(properties.domain[1]) + 1]);
            else brushG.call(brush).call(brush.move, properties.domain.map(xScale2));

        function brushing() {
            var s = d3.event.selection;
            if (!s) {
                s = xScale2.range();
                brushG.call(brush.move, xScale2.range());
                return;
            }
            xScale.domain(s.map(xScale2.invert, xScale2));

            //draw chart
            dataG.selectAll('path').remove();
            countData.forEach(function (d0, i) {
                line.x(function (d) {
                    return xScale(d[slotX])
                })
                    .y(function (d) {
                        return yScale(d[slotY])
                    });
                dataG.append('path')
                    .datum(d0)
                    .attr('class', 'line')
                    .attr('fill', 'none')
                    .attr('stroke', color(extentColor[i]))
                    .attr('stroke-width', 2)
                    .attr('d', line);
            });
            addTooltip();

            //
            xAxisG.call(xAxis);
            if (rotate)
                tickText.attr('transform', 'translate(14,14) rotate(45)');

            chartG.selectAll('.tick line')
                .style('stroke-width', '0.5')
                .style('stroke', '#C0C0BB');
            chartG.selectAll('.tick text')
                .style('fill', '#8E8883')
                .style('font-size', '10px')
                .style('font-family', 'sans-serif');
            if (rotate)
                xAxisG2.selectAll('.tick text').attr('transform', 'translate(14,14) rotate(45)');

            handle.attr('transform', function (d, i) { return 'translate(' + s[i] + ',' + brushHeight / 2 + ')'; });
        }

        function brushend() {
            let s = d3.event.selection;
            let selection = [xScale2(properties.domain[0]), xScale2(properties.domain[1])];

            if (!s) {
                s = xScale2.range();
                brushG.call(brush.move, xScale2.range());
                return;
            }
            if (s[0] == selection[0] && s[1] == selection[1]) return;
            let d0 = selection[1] - selection[0],
                d = s[1] - s[0];
            let json;

            properties.domain = [xScale2.invert(s[0]), xScale2.invert(s[1])];
            if (Math.abs(d0 - d) < 0.00001) // pan
            {
                json = {
                    'taxonomy': 'Visual Exploration',
                    'type': 'Pan',
                    'parameters': {
                        'offset': properties.domain[1] - properties.domain[0]
                    }
                };
            } else { // zoom
                json = {
                    'taxonomy': 'Visual Exploration',
                    'type': 'Zoom',
                    'parameters': {
                        'start': properties.domain[0],
                        'end': properties.domain[1]
                    }
                };
            }
            linechart.operate(json);
        }

        // STYLE
        chartG.selectAll('.domain')
            .style('stroke', '#C0C0BB');
        chartG.selectAll('.tick line')
            .style('stroke-width', '0.5')
            .style('stroke', '#C0C0BB');
        chartG.selectAll('.tick text')
            .style('fill', '#8E8883')
            .style('font-size', '10px')
            .style('font-family', 'sans-serif');
        chartG.selectAll('.axis-label')
            .style('fill', '#635F5D')
            .style('font-size', '13px')
            .style('font-family', 'sans-serif');
        chartG.selectAll('.legendCells text')
            .style('fill', '#8E8883')
            .style('font-size', '10px')
            .style('font-family', 'sans-serif');
        chartG.selectAll(".legendTitle")
            .style("fill", "#635F5D")
            .style("font-size", "12px")
            .style("font-family", "sans-serif");

        actionG.selectAll('.brush')
            .selectAll('.overlay')
            .style('display', 'none');
        actionG.selectAll('.brush')
            .selectAll('.selection')
            .style('stroke-width', 0);
        actionG.selectAll('.tick text')
            .style('fill', '#8E8883')
            .style('font-size', '10px')
            .style('font-family', 'sans-serif');
        actionG.selectAll('.domain')
            .style('stroke-width', '0.5')
            .style('stroke', '#C0C0BB');
        actionG.selectAll('.tick line')
            .style('stroke-width', '0.5')
            .style('stroke', '#C0C0BB');

        //hover
        function addTooltip() {
            //tooltipLine
            if (dataG.select('#tooltipLine')) {
                dataG.select('#tooltipLine').remove();
            }
            dataG.append('line')
                .attr('id', 'tooltipLine');

            //tipBox
            if (dataG.select('#tipBox')) {
                dataG.select('#tipBox').remove();
            }

            dataG.append('rect')
                .attr('id', 'tipBox')
                .attr('width', chartWidth)
                .attr('height', chartHeight)
                .attr('opacity', 0)
                .on('mousemove', drawTooltip)
                .on('mouseout', removeTooltip);
        }

        function drawTooltip() {
            let str = "";
            let xPos = d3.mouse(chartG.node())[0];
            let hoverX = (xScale.invert(xPos));

            function sortNumber(a, b) {
                return a - b
            }

            var slotXArr = [];
            data.forEach(function (d) {
                slotXArr.push(d[slotX[0]]);
            });
            slotXArr.push(hoverX);
            slotXArr.sort(sortNumber);
            let index = slotXArr.indexOf(hoverX);

            var hoverItem;
            if (Math.abs(slotXArr[index - 1] - hoverX) < Math.abs(slotXArr[index + 1] - hoverX)) {
                hoverItem = slotXArr[index - 1];
            } else {
                hoverItem = slotXArr[index + 1];
            }

            removeTooltip();

            if (hoverItem < xScale.domain()[0] || hoverItem > xScale.domain()[1]) return;

            if (hoverItem == "" || hoverItem == null || hoverItem == undefined) {
                str = "null";
            } else {
                str = "&emsp;" + slotX[0] + ": " + hoverItem + "<br>";
                data.forEach(function(d) {
                    if (d[slotX[0]] == hoverItem) {
                        let c = slotColor.length ? d[slotColor] : "default";
                        str += `<svg viewBox='0 1 12 12' width="10" height="10" vertical-align="middle"><circle r="5" cx="5" cy="6"  style="fill: ${color(c)};"></circle></svg>`;
                        let showList = new Set();
                        if (slotY.length) showList.add(slotY[0]);
                        if (slotColor.length) showList.add(slotColor[0]);
                        slotTooltip.forEach(function (s) {
                            showList.add(s);
                        });
                        Array.from(showList).forEach(function (d0, i0) {
                            if (i0 > 0) { str += '&emsp;'; }
                            str += d0 + ": " + d[d0] + "<br>";
                        });
                        //append circle
                        dataG.append('circle')
                            .attr("class", "hover-circle")
                            .attr("cx", xScale(hoverItem))
                            .attr("cy", yScale(d[slotY]))
                            .attr("r", 4)
                            .style("opacity", 0.7)
                            .style("fill", '#AAA');
                    }
                });
            }

            if (str != '') {
                vis.displayHoverTip(container, str);
            }

            // tooltipline
            dataG.select('#tooltipLine').attr('stroke', 'black')
                .attr('stroke-dasharray', '5,5')
                .attr('x1', xScale(hoverItem) + 0.5)
                .attr('x2', xScale(hoverItem) + 0.5)
                .attr('y1', 0)
                .attr('y2', chartHeight);
        }

        function removeTooltip() {
            vis.removeHoverTip(container);
            dataG.selectAll(".hover-circle").remove();
            const tooltipLine = dataG.select('#tooltipLine');
            if (tooltipLine) tooltipLine.attr('stroke', 'none');
        }

        return linechart;
    }

    linechart.mapping = function (_) {
        if (!arguments.length) return mappings;
        let newMappings = _;
                
        // for properties
        let oldX = mappings.get("X"),
            newX = newMappings["X"];
        if ( oldX && oldX.length &&( !newX || !newX.length ||(newX[0] !== oldX[0]))) {
            properties.domain = null;
        }

        // new mapping
        mappings.clear();
        for (let fieldName in newMappings) {
            if (newMappings.hasOwnProperty(fieldName)) {
                mappings.set(fieldName, newMappings[fieldName]);
            }
        }
        return linechart;
    };

    linechart.properties = function(_) {
        if (!arguments.length) return properties;
        properties = _;
        return linechart;
    };

    linechart.save = function() {
        let copyProperties = vis.clone(properties);
        return {
            "properties": copyProperties
        }
    };

    linechart.clear = function (json) {
        if (container) {
            container.html('');
        }
        //
        dimensions.clear();
        data = {};
        mappings.clear();

        //atcion
        properties.domain = null;

        size = [500, 500];
        margin = {
            left: 10,
            top: 10,
            right: 10,
            bottom: 10
        };
        isRendered = false;
        return linechart;
    }

    linechart.operate = function (json) {
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
        'Mapping': function (parameters) {
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
        'Zoom': function (parameters) {
            // Zoom
            return zoom(parameters.start, parameters.end);
        },
        'Pan': function (parameters) {
            // Pan
            return pan(parameters.offset);
        },
        'Inspect': function (parameters) {
            // Inspect
            return inspect();
        },
        'Brush': function (parameters) {
            // Brush
            return brush();
        },
        'Restore': function (parameters) {
            // Restore
            return restore(parameters.mapping, parameters.state);
        }
    }

    let insightActions = {
        'Snapshot': function (parameters) {
            return snapshot();
        },
        'Save': function (parameters) {
            return saveState();
        },
        'Bookmark': function (parameters) {
            return saveState(parameters.note);
        }
    }

    let addMapping = function (slot, dimension) {
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

        if (slot == "X") {
            properties.domain = null;
        }

        if (linechart.isReady()) {
            linechart.update();
        } else {
            clearCanvas();
        }
        return true;
    }

    let removeMapping = function (slot, dimension) {
        if (mappings.has(slot) && mappings.get(slot).length) {
            let d = mappings.get(slot),
                i = d.indexOf(dimension);

            if (i > -1) {
                d.splice(i, 1);
                if (linechart.isReady()) {
                    linechart.update();
                } else { // clear canvas
                    clearCanvas();
                }
                return true;
            }
        }
        return false;
    }

    let zoom = function (s, e) {
        dispatch.call('zoom', { detail: { start: s, end: e } });
    }

    let pan = function (o) {
        dispatch.call('pan', { detail: { offset: o } });
    }

    let inspect = function (nodeId) { }

    let brush = function () { }

    let snapshot = function () {
        return container.select('.container').node().outerHTML;
    }

    let saveState = function (note) {
        let svg;
        if (!note) { // save
            if (linechart.isReady())
                svg = container.select('.container').node().outerHTML;
        }
        let parameters = {
            'note': note,
            'svg': svg,
            'mapping': JSON.parse(MapTOJson(mappings)),
            'state': {
                'domain': properties.domain
            }
        }
        return JSON.stringify(parameters);
    }

    let restore = function (mapping, state) {
        // mappings
        mappings.clear();
        for (let slot in mapping) {
            mappings.set(slot, mapping[slot]);
        }
        if (linechart.isReady()) {
            let xExtent = dimensions.get(mappings.get("X")[0]).extent();
            if (state.domain[0] > state.domain[1] || state.domain[0] >= xExtent[1] || state.domain[1] <= xExtent[0]) return;
            properties.domain = [Math.max(state.domain[0], xExtent[0]), Math.min(state.domain[1], xExtent[1])];          
            linechart.update();
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
        m.forEach(function (items, key, mapObj) {
            str += '"' + key + '":[';
            items.forEach(function (item, index) {
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

    return linechart;
}