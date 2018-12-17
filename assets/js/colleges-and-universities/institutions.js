/*
  --------------------------------------------------------------------------------------------------------------------
  *   declarations
  *--------------------------------------------------------------------------------------------------------------------
  */
const mapContainer = document.getElementById('collegesMap');
const publicCheck = document.getElementById('publicCheck');
const privateCheck = document.getElementById('privateCheck');
const fourYearCheck = document.getElementById('fourYearCheck');
const twoYearCheck = document.getElementById('twoYearcheck');

const sectionFourtableBtn = document.getElementById('sectionFourTableBtn');
const sectionFourmapBtn = document.getElementById('sectionFourMapBtn');
const sectionFourtreemapBtn = document.getElementById('sectionFourTreemapBtn');


/*
  --------------------------------------------------------------------------------------------------------------------
  *   functions
  *--------------------------------------------------------------------------------------------------------------------
  */

// Find the nodes within the specified rectangle.
function search(quadtree, x0, y0, x3, y3) {
  let validData = [];
  quadtree.visit(function(node, x1, y1, x2, y2) {
    var p = node.data;
    if (p) {
      p.selected = (p[0] >= x0) && (p[0] < x3) && (p[1] >= y0) && (p[1] < y3);
      if (p.selected) {
        validData.push(p);
      }
    }
    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
  });
  return validData;
}

// Collapse the quadtree into an array of rectangles.
function nodes(quadtree) {
  var nodes = [];
  quadtree.visit(function(node, x0, y0, x1, y1) {
    node.x0 = x0, node.y0 = y0;
    node.x1 = x1, node.y1 = y1;
    nodes.push(node);
  });
  return nodes;
}

/**
 * for Section4 Tree!
 * More or less the exact same as Section2...
 */
function sectionFourTreeMap() {
  d3.csv('../data-lab-data/EDU_v2_base_data.csv', (data) => {


    let schools = data.map(d => d.Recipient);
    let filteredSchools = schools.filter(function(item, index){
      return schools.indexOf(item) >= index;
    });


    // Going to do Sidebar Data first.
    // Just a simple list
    let sidebarList = d3.select('#sectionFourTreemapSidebar')
        .append('ul').attr('class', 'sectionFourSidebarList');

    sidebarList.selectAll('li')
      .data(filteredSchools)
      .enter()
      .append('li')
      .attr('class', 'sidebarListElement') // use for on click maybe?
      .html(String);

    ///////////////////////
    // start Treemappin' // 
    ///////////////////////
    let width = 1000,
        height = 600;

    let color = d3.scaleOrdinal()
        .range(d3.schemeCategory10
               .map(function(c) { c = d3.rgb(c); c.opacity = 0.6; return c; }));

    let format = d3.format(",d");

    let treeMappy = d3.treemap()
        .size([width, height])
        .round(true)
        .padding(1);


    let bigTotal = data.map(i => i.Total_Federal_Investment).reduce((a,b) => a + b);
    data.forEach(function(i) { i.parent = "rootNode"; }); // add parent property to each child of root node for stratify

    let rootNode = {
      name: 'rootNode',
      Total_Federal_Investment: bigTotal,
      parent: "",
    };

    data.unshift(rootNode); // add root node to beginning of array
    //    console.log(data);

    let stratify = d3.stratify()
        .id(function(d) {
          return d.name;
        })
        .parentId(function(d) { return d.parent; });

    let root = stratify(data)
        .sum(function(d) { return d.Total_Federal_Investment; })
        .sort(function(a, b) { return b.height - a.height || b.Total_Federal_Investment - a.Total_Federal_Investment; });

    let treeMapContainer = d3.select('#sectionFourTreemap') // section 4! 
        .append('svg')
        .style('width', width)
        .style('height', height);
    //        .style('position', 'relative');

    treeMappy(root); // stratify and get the root ready

    let leaf = treeMapContainer
        .selectAll('g')
        .data(root.leaves())
        .enter().append('g')
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append('text')
      .attr('x', function(d) {return d.x0; })
      .attr('y', function(d) {return d.y0; });
    //      .text(d => {
    //        return d.id + "\n" + format(d.value);
    //      });

    leaf.append("rect")
      .attr("id", d => d.id)
      .attr("fill", function(d) { var a = d.ancestors(); return color(a[a.length - 2].id); })
      .attr("fill-opacity", 0.6)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);


  }); 
}; // end function


/*
  purpose : draws map and appends to given container
*/
const drawMap = (container) => {

  var width = 1920,
      height = 1000,
      centered;

  var projection = d3.geoAlbersUsa()
      .scale(1500) // was 1500
      .translate([width / 2, height / 2]);

  var path = d3.geoPath()
      .projection(projection)
      .pointRadius(1);

  // D3-tip Tooltip
  let toolTip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "School: <span style='color:blue'>" + d.Recipient + "</span>" + "<br>"
          + d.INSTURL + "<br>" + "Students: " + d.Total;
      });

  var svg = d3.select(container).append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.call(toolTip); // add tooltip

  // what our map element is drawn on 
  let g = svg.append("g");

  /**
   * us-states holds the mapping in data.features (us.features)
   * simply for helping draw the visual
   */
  d3.json("../data-lab-data/us-states.json", function (error, us) {
    if (error) throw error;

    let map = g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(us.features)
        .enter().append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "1.5")
        .on("click", clicked);

    let circles = map.append("svg:g")
        .attr("id", "circles");


    /**
     * EDU Data Section
     * 
     */
    d3.csv("../data-lab-data/EDU_v2_base_data.csv", function (error, data) {
      if (error) throw error;

      /**
       * Filter Boxes
       */
      let public = d3.select(publicCheck);
      let private = d3.select(privateCheck);
      let fouryear = d3.select(fourYearCheck);
      let twoyear = d3.select(twoYearCheck);
      let filterClearBtn = d3.select('.clearfilter');
      //      filterClearBtn

      // Dropdown Box
      let dropDown = d3.select("#filtersDiv").append("select")
          .attr("name", "college-list")
          .attr('id', 'college-dropdown')
          .style('width', '200px');

      let options = dropDown.selectAll("option")
          .data(data)
          .enter()
          .append("option");

      options.text(function (d) { return d.Recipient; })
        .attr("value", function (d) { return d.Recipient; });

      // Clear Filter Box
      let clearfilter = d3.select('#filtersDiv').append('button')
          .attr('name', 'clearBtn')
          .attr('id', 'clearnBtn')
          .text('Clear Filter')
          .on('click', function(d) {
            svg.selectAll('circle').remove();
            
            // redrawing map to show all points!
            svg.selectAll("circle")
              .data(data)
              .enter()
              .append("svg:circle")
              .attr("transform", function (d) {
                
                let long = parseFloat(d.LONGITUDE);
                let lat = parseFloat(d.LATITUDE);
                if (isNaN(long || lat)) { long = 0, lat = 0; }
                //console.log(long, lat);
                return "translate(" + projection([long, lat]) + ")";
              })
              .attr('r', 4)
              .style("fill", "rgb(217,91,67)")
              .style("opacity", 0.85)
              .on('mouseover', toolTip.show)
              .on('mouseout', toolTip.hide);
            
          });

      /////////////////////////
      // PR Quadtree Section //
      /////////////////////////
      var clusterPoints = [];
      var clusterRange = 45;
      
//      var grid = svg.append('g')
//          .attr('class', 'grid');
//      
//      for (var x = 0; x <= width; x += clusterRange) {
//        for (var y = 0; y <= height; y+= clusterRange) {
//          grid.append('rect')
//            .attr('x', x)
//            .attr('y', y)
//            .attr('width', clusterRange)
//            .attr('height', clusterRange)
//            .attr('class', 'grid')
//            .attr('id', 'invisRect');
//        }
//      }

      // for this data structure,
      // we need to return an Array of Arrays! (important!)
      let latlongpoints = data.map(function(x) {
        let point = [
          x.LATITUDE,
          x.LONGITUDE
        ];
        return point;
      });
                                   
      console.log(latlongpoints); // should be array of arrays 

      let qTree = d3.quadtree()
          .addAll(latlongpoints); // adding points to quadtree

      console.log(qTree);

      console.log('before for loop');
      for (let a = 0; a <= width; a += clusterRange) {
        for (let b = 0; b <= height; b += clusterRange) {
          let searched = search(qTree, a, b, a + clusterRange, b + clusterRange);
          console.log(searched); // only (3) is working?

          let centerPoint = searched.reduce(function(prev, current) {
            return [prev[0] + current[0], prev[1] + current[1]];
          }, [0, 0]);
          
          centerPoint[0] = centerPoint[0] / searched.length;
          centerPoint[1] = centerPoint[1] / searched.length;
          centerPoint.push(searched);
          
          if (centerPoint[0] && centerPoint[1]) {
            clusterPoints.push(centerPoint);
          }
        }
      }

      svg.selectAll(".centerPoint")
        .data(clusterPoints)
        .enter().append("circle")
        .attr("class", function(d) {return "centerPoint";})
        .attr("cx", function(d) {return d[0];})
        .attr("cy", function(d) {return d[1];})
        .attr("fill", '#FFA500')
        .attr("r", 6)
        .on("click", function(d, i) {
          console.log(d);
        });

      // ! This is where we draw the circles on the map
//       svg.selectAll("circle")
//        .data(data)
//        .enter()
//        .append("svg:circle")
//        .attr("transform", function (d) {
//
//          let long = parseFloat(d.LONGITUDE);
//          let lat = parseFloat(d.LATITUDE);
//          if (isNaN(long || lat)) { long = 0, lat = 0; }
//          return "translate(" + projection([long, lat]) + ")";
//        })
//        .attr('r', 5)
//        .style("fill", "rgb(217,91,67)")
//        .style("opacity", 0.85)
//        .on('mouseover', toolTip.show)
//        .on('mouseout', toolTip.hide);


      dropDown.on("change", function () {
        let selected = this.value;
        let displayOthers = this.checked ? "inline" : "none";
        let display = this.checked ? "none" : "inline";

        svg.selectAll("circle")
          .filter(function (d) { return selected != d.Recipient; })
          .attr("display", displayOthers);

        svg.selectAll("circle")
          .filter(function (d) { return selected == d.Recipient; })
          .attr("display", display);
      });

      //publicCheck.on('change', updateCheck); // on change event
      //public.on('change', console.log('clicked'));
      //private.on('change', console.log('checked private'));

      //update(); // run checkbox state check

      /**
       * Section to check for checkbox state
       */
      function updateCheck() {
        if (d3.select(public).property('checked')) {
          svg.selectAll('circle')
            .filter(function (d) {
              console.log('okok' + d.INST_TYPE);
              return 'Public 2-year' == d.INST_TYPE;
            });
        } else {
          svg.selectAll("circle")
            .data(data)
            .enter()
            .append("svg:circle")
            .attr("transform", function (d) {
              let long = parseFloat(d.LONGITUDE);
              let lat = parseFloat(d.LATITUDE);
              if (isNaN(long || lat)) { long = 0, lat = 0; }
              return "translate(" + projection([long, lat]) + ")";
            })
            .attr('r', 5);
        }
      }

      //console.log(data['LONGITUDE'], data["LATITUDE"][0]);

      //console.log(LatLongObj);

    });
  }); // end of double d3 zone 


  function clicked(d) {
    var x, y, k;

    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    g.selectAll("path")
      .classed("active", centered && function (d) { return d === centered; });

    g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
  }

}; // end main wrapper 

/*
  --------------------------------------------------------------------------------------------------------------------
  *   Main Method
  *--------------------------------------------------------------------------------------------------------------------
  */

drawMap(mapContainer); // section 4 USA map
sectionFourTreeMap(); // section 4 treemap

/*
  Event Handlers
*/
$(sectionFourtableBtn).click(function() {
  console.log('clicking table button!');
  $('#sectionFourTableContainerDiv').css('display', 'flex'); // our table!
  $('#sectionFourTreemapContainerDiv').css('display', 'none'); // treemap
  $('#mapContainerDiv').css('display', 'none'); // donut 
});

$(sectionFourmapBtn).click(function() {
  console.log('clicking map button!');
  $('#mapContainerDiv').css('display', 'flex'); // donut! (set to inline-block from before)
});

$(sectionFourtreemapBtn).click(function() {
  console.log('clicking treemap button!');
  $('#sectionFourTreemapContainerDiv').css('display', 'flex'); // tree
  $('#tableContainerDiv').css('display', 'none'); // table 
  $('#mapContainerDiv').css('display', 'none'); // usa map
});






