let vis = {
    colorCategory12a: ['rgb(31,120,180)', 'rgb(178,223,138)',
        'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)',
        'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)',
        'rgb(106,61,154)', 'rgb(255,255,153)', 'rgb(166,206,227)', 'rgb(177,89,40)'
    ],
    colorCategory12b: ["#BFDDA3", "#FFE9A9", "#F09192", "#F9D1D4",
        "#6A89AD", "#A2AAE8", "#B99FE8", "#FFCA36",
        "#FF8247", "#FF8C69", "#FFD39B", "#FFE7BA",
        "#FFB6C1", "#DC143C", "#FFF0F5", "#EE82EE",
    ],
    colorCategory10a: ["#f9e674", "#f39800", "#82c693", "#fcc6c1",
        "#cce198", "#78b6c5", "#c490bf", "#6177ba",
        "#314451", "#85eedc",
    ],
    colorCategory23a: ["#f9e674", "#f39800", "#facd89", "#987352",
        "#82c693", "#cce198", "#cebc71", "#f38c6f",
        "#d6c0a6", "#fcc6c1", "#b8adbd", "#c36671",
        "#c490bf", "#005982", "#8957a1", "#6177ba",
        "#7ecef4", "#85eedc", "#13b5b1", "#bcd7de",
        "#78b6c5", "#314451", "#e5d9d7"
    ],
    colorLinear2a: ["#aadcff", "#0050a2"],
    color: {
        "Blue": '#4DA1FF',
        "DeepBlue": "rgb(8,104,172)",
        "LightBlue": "rgb(204,235,197)",
    }
}

vis.dimension = function(_name, _dataType, _extent) {
    let dimension = new Object(),
        name = _name || "",
        dataType = _dataType || "Numerical",
        extent = _extent || [];

    dimension.name = function(_) {
        if (!arguments.length) return name;
        name = _;
        return dimension;
    };

    dimension.dataType = function(_) {
        if (!arguments.length) return dataType;
        dataType = _;
        return dimension;
    };

    dimension.extent = function(_) {
        if (!arguments.length) return extent;
        extent = _;
        return dimension;
    };

    return dimension;
};

vis.slot = function(_name, _description, _dataTypes, _isMultiple, _isRequired) {

    let slot = new Object(),
        name = _name || "",
        description = _description || "",
        dataTypes = _dataTypes || ["Numerical"], //Categorical,Numerical
        isMultiple = _isMultiple || false, //defalut:not multiple
        isRequired = _isRequired || false; //default:not required


    slot.name = function(_) {
        if (!arguments.length) return name;
        name = _;
        return slot;
    };

    slot.description = function(_) {
        if (!arguments.length) return description;
        description = _;
        return slot;
    };

    slot.dataTypes = function(_) {
        if (!arguments.length) return dataTypes;
        dataTypes = _;
        return slot;
    };

    slot.isMultiple = function(_) {
        if (!arguments.length) return isMultiple;
        isMultiple = _;
        return slot;
    };

    slot.isRequired = function(_) {
        if (!arguments.length) return isRequired;
        isRequired = _;
        return slot;
    };

    return slot;
};

//inspect tip
vis.displayInspectTip = function(container, str, location) {

    let inspecttip = container.append('div')
        .attr('class', 'inspectTip')
        .style('background', "#666")
        .style('font-size', "16px")
        .style('color', "white")
        .style('padding', '10px')
        .style('border-radius', '10px')
        .style('position', 'absolute');

    inspecttip.html(str)
        .style('left', function() {
            let width = this.clientWidth || this.offsetWidth;
            if (location[0] + width > container.attr("width")) {
                return Math.max(location[0] - width - 10, 10) + 'px';
            }
            return location[0] + 'px';
        })
        .style('top', function() {
            let height = this.clientHeight || this.offsetHeight;
            let top;
            container.each(function() {
                top = (this.offsetTop - getScrollTop());
            });
            if (location[1] - top + height > container.attr("height")) {
                return Math.max(location[1] - height - 10, 10 + top) + 'px';
            }
            return (location[1] + 10) + 'px';
        });
}

//hover tip
vis.displayHoverTip = function(container, str) {
    let offset = d3.mouse(container.node());
    container.append("div")
        .attr("class", "hoverTip")
        .style("position", "absolute")
        .style("left", offset[0] + 30 + "px")
        .style("top", offset[1] + 10 + "px")
        .style("background", "white")
        .style("border-radius", "5px")
        .style("padding-left", "8px")
        .style("padding-right", "8px")
        .style("padding-top", "4px")
        .style("padding-bottom", "4px")
        .style("box-shadow", "2px 2px 2px 2px #DFDFDF")
        .style("color", "#646464")
        .style("font-size", "12px")
        .style("max-width", "200px")
        .html(str);
}

vis.removeHoverTip = function(container) {
    container.selectAll('.hoverTip').remove();
}

//gradient bar
vis.displayGradientBar = function(canvas, extent, color = vis.colorLinear2a, opacity) {

    let gradientX = 30,
        gradientY = canvas.attr("height") / 5 * 4,
        gradientW = canvas.attr("width") / 5,
        gradientH = 15;

    let defs = canvas.append('defs');
    let linearGradient = defs.append('linearGradient')
        .attr('id', 'linearColor')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
    let stop1 = linearGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', d3.rgb(color[0]));
    let stop2 = linearGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', d3.rgb(color[1]));
    let colorRect = canvas.append('rect')
        .attr('x', gradientX)
        .attr('y', gradientY)
        .attr('width', gradientW)
        .attr('height', gradientH)
        .attr("opacity", opacity)
        .style('fill', 'url(#' + linearGradient.attr('id') + ')');
    let minValueText = canvas.append('text')
        .attr('class', 'valueText')
        .attr('x', gradientX)
        .attr('y', gradientY)
        .attr('dy', '-0.4em')
        .style('fill', "#666")
        .style('font-size', "12px")
        .style('text-anchor', "middle")
        .text(function() {
            return extent[0];
        });
    let maxValueText = canvas.append('text')
        .attr('class', 'valueText')
        .attr('x', gradientX + gradientW)
        .attr('y', gradientY)
        .attr('dy', '-0.4em')
        .style('fill', "#666")
        .style('font-size', "12px")
        .style('text-anchor', "middle")
        .text(function() {
            return extent[1];
        });
}

vis.initDimensions = function(data) {
    let dimensions = [];
    //csv
    if (data.columns) {
        //delete repeated dimension name
        data.columns = Array.from(new Set(data.columns));
        //init dimension
        data.columns.forEach(function(name) {
            let dimension = vis.dimension().name(name);
            let result = 0;
            /*Numerical 0, Categorical 1, Temporal 2*/
            let time = 0;
            let categor = 0;
            data.forEach(function(d) {
                if (isNaN(d[name])) { //not number
                    if (isNaN(Date.parse(d[name]))) { //categorical
                        categor++;
                    } else { //Temporal
                        time++;
                    }
                }
            });
            if (categor) result = 1;
            else if (time) result = 2;

            if (result == 0) { //Numerical
                dimension.extent(d3.extent(data.filter(d => (d[name] == null || d[name] == "") ? false : true), d => Number(d[name])));
            } else if (result == 1) {
                dimension.dataType('Categorical')
                    .extent(Array.from(new Set(data.map(d => d[name]))).filter(d => (d == null || d == "") ? false : true));
            } else if (result == 2) {
                dimension.dataType('Temporal').extent(d3.extent(data.filter(d => (d[name] == null || d[name] == "") ? false : true), d => d[name]));
            }
            dimensions.push(dimension);
        });
    }
    return dimensions;
}

vis.filterAbnormity = function(data, dimensions) {
    let ds = new Set();
    dimensions.forEach(function(d) {
        d.forEach(function(dimension) {
            ds.add(dimension);
        });
    });
    ds = Array.from(ds);

    data = data.filter(function(d) {
        for (let i in ds) {
            if (d[ds[i]] == null || d[ds[i]] == "")
                    return false;
        }
        return true;
    });
    return data;
}

vis.clone = function(properties) {
    return JSON.parse(JSON.stringify(properties))
}

vis.eventHandle = function(eventProxy, json){
    // used in system
    // eventProxy.dispatchAction(json.type, json);
}

vis.map2json = function(m) {
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