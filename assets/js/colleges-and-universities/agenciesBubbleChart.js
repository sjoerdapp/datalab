/*
  --------------------------------------------------------------------------------------------------------------------
  *   Local declarations
  *--------------------------------------------------------------------------------------------------------------------
  */
const bubbleColor = '#0000ff';
const bubbleChartContainer = document.getElementById('bubbleChartContainer');
const sectionThreeTreemapBtn = document.getElementById('sectionThreeTreemapBtn');

/*
  --------------------------------------------------------------------------------------------------------------------
  *   functions
  *--------------------------------------------------------------------------------------------------------------------
  */

/**
 * for Section3 Tree!
 * More or less the exact same as Section2 and 4.
 */
function sectionThreeTreemap(agenciesData) {
  d3.csv('../data-lab-data/Edu_PSC.csv', (data) => {
    
    console.log(agenciesData);

    let agencies = data.map(d => d.agency);
    let filteredSchools = agencies.filter(function(item, index){
      return agencies.indexOf(item) >= index;
    });

    // Going to do Sidebar Data first.
    // Just a simple list
    let sidebarList = d3.select('#sectionThreeTreemmapSidebar')
        .append('ul').attr('class', 'sectionThreeSidebarList');

    sidebarList.append('input')
      .attr('class', 'search')
      .attr('class', 'searchPadding')
      .attr('placeholder', 'Search...');

    sidebarList.selectAll('li')
      .data(filteredSchools)
      .enter()
      .append('li')
      .attr('class', 'sidebarListElement') // use for on click maybe?
//      .on('click', function(d) {
//        createSecondaryTreemapTableSectFour(d, ['Type', 'Awarded Amount', '% of Total']);
//        console.log(d);
//      })
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


//    let bigTotal = data.map(i => i.Total_Federal_Investment).reduce((a,b) => a + b);
    agenciesData.forEach(function(i) { i.parent = "rootNode"; }); // add parent property to each child of root node for stratify

    let rootNode = {
      name: 'rootNode',
      obligation: '1000000',
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

    let treeMapContainer = d3.select('#sectionThreeTreemap') // section 4! 
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


//takes bubble nodes information and sets radius between 10 and 60
//based on percentage of total spending
const addRadius = (nodes) => {

  //total obligation
  let totalSpent = nodes.reduce((a, b) => {  return a + b.total;  }, 0);

  //sized by percentage clamp at 10 - 100 px
  nodes.forEach(n => {
    let percentage = ((n.total/totalSpent)*400);
    if (percentage < 10) {
      n.radius = 10;
    } else if (percentage > 100) {
      n.radius = 100;
    } else {
      n.radius = Math.floor(percentage);
    }
  });
  return nodes;
};

/*
  purporse : this method is passed a div container and will append
  a bubble chart tot he given container
*/
const drawChart = (container, data) => {
  
  var width = 960, height = 600;
  
  
  var nodes = data,
      root = nodes[0],  
      color = d3.scale.category10(); 

  root.radius = 0;
  root.fixed = true;

  var force = d3.layout.force()
      .gravity(0.05)
      .charge(function(d, i) { return -10; })
      .nodes(nodes)
      .size([width, height]);

  force.start();

  var svg = d3.select(container).append("svg")
      .attr("width", width)
      .attr("height", height);

  var node = svg.selectAll("circle")
      .data(nodes.slice(1))
      .enter().append("circle")
      .attr("r", function(d) { return d.radius; })
  
      .style("fill", bubbleColor)
      .on("tick", tick)
      .call(force.drag);

  // we're going to add text labels real fast!
//  node.append("text")
//    .attr("dy", ".2em")
//    .style("text-anchor", "middle")
//    .text(function(d) {
//      return d.agency[1];
//    })
//    .attr("font-family", "sans-serif")
//    .attr("font-size", function(d){
//      return d.r/5;
//    })
//    .attr("fill", "white");
  
  force.on("tick", function(e) {
    var q = d3.geom.quadtree(nodes),
        i = 0,
        n = nodes.length;

    while (++i < n) q.visit(collide(nodes[i]));

    svg.selectAll("circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  });


  svg.on("click", function() {
    var p1 = d3.mouse(this);
    root.px = p1[0];
    root.py = p1[1];
    force.resume();
  });

  function collide(node) {
    var r = node.radius + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
            y = node.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = node.radius + quad.point.radius;
        if (l < r) {
          l = (l - r) / l * .5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  }
  
  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }


};

/*
  --------------------------------------------------------------------------------------------------------------------
  *   Main Method
  *--------------------------------------------------------------------------------------------------------------------
  */
d3.csv("/data-lab-data/Edu_PSC.csv"), (data) => {    //read in education data to data files

  var agenciesData = data.reduce((a, b) => {     //caluculate total grants money  sum(grants_received + research_grants_received)
    
    if (! (a.reduce((accumBool, node) => { 
      if(b.agency === node.name) { 
        node.total += parseFloat(b.obligation);
        accumBool = true;
      }  
      return accumBool;
    }, false))){
      a.push({
        name: b.agency,
        total: parseFloat(b.obligation)
      });
    } 
    
    return a;
  },[]);


  // call all functions at end of main method //
  // odd practice for javascript but following last dev's convention for time-sake //
  addRadius(agenciesData);
  drawChart(bubbleChartContainer, agenciesData);
  sectionThreeTreemap(agenciesData); // call treemap (default to hidden)
};

/*
  Event Handlers
*/
//$(sectionFourtableBtn).click(function() {
//  console.log('clicking table button!');
//  $('#sectionFourTableContainerDiv').css('display', 'flex'); // our table!
//  $('#sectionFourTreemapContainerDiv').css('display', 'none'); // treemap
//  $('#mapContainerDiv').css('display', 'none'); // donut 
//});

//$(sectionFourmapBtn).click(function() {
//  console.log('clicking map button!');
//  $('#mapContainerDiv').css('display', 'flex'); 
//  $('#sectionFourTreemapContainerDiv').css('display', 'none'); 
//});
//
$(sectionThreeTreemapBtn).click(function() {
  console.log('clicking treemap button!');
  $('#sectionThreeTreemapContainerDiv').css('display', 'flex'); // tree
  $('#tableContainerDiv').css('display', 'none'); // table 
  $('#mapContainerDiv').css('display', 'none'); // usa map
});


