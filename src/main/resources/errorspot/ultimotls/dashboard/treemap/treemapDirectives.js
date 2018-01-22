/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var treemapDirectiveModule = angular.module('treemapDirectiveModule', ['treemapControllerModule']);

treemapDirectiveModule.directive('treemapZoom', ['$location', function($location){
    var w = document.getElementById('treemapDiv').offsetWidth, w2=w*.8,
        h = window.innerHeight*.885,
        x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]),
        x2 = d3.scale.linear().range([0, w]),
        y2 = d3.scale.linear().range([0, h]),
        color = d3.scale.ordinal().range(["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
            "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", 
            "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
            "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5",
            "#5254a3", "#8ca252", "#bd9e39", "#ad494a", "#a55194", 
            "#6b6ecf", "#b5cf6b", "#e7ba52", "#d6616b", "#ce6dbd"]),
        root,
        node,
        nodes,
        brush,
        brush1,
        remakeFlag = true,
        zoomFlag = false,
        zoomFlag2 = false,
        tempName = "",
        transformArr = [{}],
        svgDivider = 0,
        parCellSpacer=0,
        parCellCounter=1,
        brushStorage = [],
        headerFlag = false,
        cursorFlag = false;
        
    x2.domain([0, w]);
    y2.domain([0, h]);

    var svg = d3.select("#treemapZoom").append("div")       //creates svg for the treemap to be built into
        .attr("class", "chart")
        .attr("id", "treemapChart")
        .style("width", w + "px").style("height", h + "px")
        .style("right", 7 + "px")
        .append("svg").attr("width", w).attr("height", h)
        .attr("id", "treemapSVG");
        
    function updateSize(resizeTemp, element, scope){            //resets all necessary measurements on resizing
        if(resizeTemp === 0){
            svg.selectAll("rect").remove();
            svg.selectAll("text").remove();
            svg.append("text").attr("x", w/3).attr("y", h/3)
                .text("No Data Available");
            return;
        }
        w = document.getElementById('treemapDiv').offsetWidth;
        w2 = w*.8;
        h=window.innerHeight*.885;
        x = d3.scale.linear().range([0, w]);
        y = d3.scale.linear().range([0, h]);

        d3.select("#treemapZoom").select("div")
            .style("width", w + "px").style("height", h + "px")
        .select("svg").attr("width", w).attr("height", h);
        
        parCellCounter=1;
        d3.select("#legend").select("div")
            .style("width", w2 + "px").style("height","20px")
            .select("svg").attr("width", w2).attr("height", "19px")
            .selectAll("g")
                .attr("transform", function(d) {parCellSpacer = w2*(parCellCounter/scope.treemapSaver.dividerSaver)*.8;
                parCellCounter++;return "translate(" + parCellSpacer + ",0)"; });
        $("#zoomOut").d3Click();
        createZoomTree(resizeTemp, element, "true", scope, false);
    }          
    function createZoomTree(treeDataset, element, flag, scope, resizedWin){     //takes care of all treemap creation
        if(treeDataset === 0){                  //shows a message if no data is present
            svg.selectAll("rect").remove();
            svg.selectAll("text").remove();
            svg.append("text").attr("x", w/3).attr("y", h/3).text("No Data Available");
            return;
        }
        d3.select("#zoomOut").on("click", "").style("cursor","auto");
        d3.select("#zoomIn").on("click", "").style("cursor","auto");
        if(scope.treemapSaver.brushCounter === undefined)scope.treemapSaver.brushCounter = 2;               //keeps track of how many brushes
        if(scope.treemapSaver.brushCounterZoomed === undefined)scope.treemapSaver.brushCounterZoomed = 0;   //have been created
        if(scope.treemapSaver.svgCounter === undefined)scope.treemapSaver.svgCounter = 0;                   //
        var resized = resizedWin;
        var jsonRaw = treeDataset;
        var treeData = {name:"tree", children:[{}]};
        var treeChildren = [{}];
        if(jsonRaw !== undefined){
            if(treeDataset.constructor === Array){          //checks for type of data which may not need to be formatted
                svg = d3.selectAll("#treemapZoom").selectAll("div").select("#treemapSVG");
                for(var a=0;a<jsonRaw.length;a++){          //Formats incoming data to treemap friendly format
                    for(var b = 0; b < jsonRaw[a].children.length; b++){
                        treeChildren[b] = ({size:jsonRaw[a].children[b].size, name:jsonRaw[a].children[b].name });
                    }
                    treeData.children[a] = ({children:treeChildren, name:jsonRaw[a].name});
                    treeChildren = [{}];
                };
            }
            else{
                d3.select("#zoomOut").on("click", function() { zoom(root, "flag", "flag"); }).style("cursor","auto");
                d3.select("#zoomIn").on("click", customZoomBtn).style("cursor","auto");
                treeData = treeDataset;
                svg = d3.selectAll("#treemapZoom").selectAll("div").select("svg.newSVG");       //change svg for custom zooming
            }
        }
        if(scope.treemapSaver.envSave !== undefined){
            if(scope.treemapSaver.envSave !== scope.env){
                remakeFlag = true;
            }
        }
        if(document.getElementById("treemapChart") === null){   //checks for treemap on recreation 
            svg = d3.select("#treemapZoom").append("div")
                .attr("class", "chart")
                .attr("id", "treemapChart")
                .style("width", w + "px").style("height", h + "px")
                .style("right", 7 + "px")
                .append("svg").attr("width", w).attr("height", h).attr("id", "treemapSVG");
            }
        if(document.getElementById("treemapLegend") === null){  //check for legend dropdown on recreation
            parSvg = d3.select("#legend").append("div")
            .attr("class", "chart").attr("id", "treemapLegend")
            .style("width", w2 + "px").style("height","20px")
            .append("svg").attr("width", w2).attr("height", "19px").attr("id", "treemapLegendSVG");
        }
        brush1 = d3.svg.brush()                 //brush for custom zooming while custom zoomed
         .x(x2).y(y2).on("brushend", brushed);

        brushStorage[scope.treemapSaver.brushCounter] = d3.svg.brush()  //initializes dynamically named brushes for initial zoom
          .x(x).y(y).on("brushend", brushed);

        var treemap = d3.layout.treemap()       //sets parameters and sorting methods for treemap
            .size([w, h])
            .sticky(true)
            .value(function(d) { return d.size; })
            .sort(function(a,b) {
                return a.value - b.value;
            });
        if(treeDataset.constructor === Array){  //clears custom zoomed svg on data change
            d3.selectAll(".brush").call(brushStorage[scope.treemapSaver.brushCounter].clear());
            d3.selectAll("g.brush").remove();
            d3.selectAll("svg.newSVG").remove();
            //d3.select("#zoomIn").style("cursor","pointer");
            d3.selectAll("#treemapSVG").transition().duration(750).style("opacity","1").style("display","inline");
            d3.select("#zoomOut").on("click", function() { zoom(root, "flag", "flag"); });
            scope.treemapSaver.customZoomed = undefined;
        }
        node = root = treeData;
        svgDivider = 0;
        nodes = treemap.nodes(root)         //pulls out parent nodes
            .filter(function(d){return!d.children;});
        if(d3.selectAll("#newSvg")[0].length === 0){
            scope.treemapSaver.nodeSaver = nodes;
        }
        var parNodes = treemap.nodes(root)      //pulls out child nodes
            .filter(function(d) {if(d.name !== "tree"){return d.children ? "tree" : d.children;} });
        var cell = svg.selectAll("g").data(nodes);
        
        if(treeDataset.constructor === Array){  //reformats dropdown on custom zooming
            d3.select("#legendDropDown").select("ul").remove();
            var legendDDL = d3.select("#legendDropDown").append("ul").append("select")
                .attr("id","legendSelect")
                .attr("class", "legendDDL replayDropDown");
            var parDropDown = legendDDL.selectAll("#legendSelect").data(parNodes);
            d3.selectAll("#legendSelect").data(parNodes).on("change", function(d) {
                
                if(document.getElementById("newSvg") === null){
                    for(var change=0; change < d.parent.children.length; change++){
                        if(d3.event.target.value === d.parent.children[change].name){
                            return zoom((node === d.parent.children[change] ? root : d.parent.children[change]),"0","0");
                        }
                    };
                }else{
                    var selectedVal = d3.event.target.value;
                    setTimeout(function () {
                        zoomOutBrushed();
                    }, 10);
                    
                    setTimeout(function () {
                        for(var change=0; change < d.parent.children.length; change++){
                            if(selectedVal === d.parent.children[change].name){
                                return zoom((node === d.parent.children[change] ? root : d.parent.children[change]),"0","0");
                            }
                        };
                    }, 110);
                    
                }
                
            });           
            parDropDown.enter().append("option")
                .attr("id",function(d){return d.name;})
                .text(function(d){return d.name;})
                .style("background", function(d) { return color(d.name); });            
            var ddlSelect = document.getElementById("legendSelect");
            var option = document.createElement("option");
            option.text = "Select...";
            option.style.display = "none";
            ddlSelect.add(option, ddlSelect[0]);
        }
        if(jsonRaw !== undefined)
        {
            if(scope.treemapSaver.data === undefined){                //checks if the scope is preserved
            svg.selectAll("text").remove();
            scope.treemapSaver.data = undefined;
            cell.enter().append("g").attr("class", "cell")      //modifies all basic g elements
                .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; })
                .on("mouseover", mouseOverCell)
                .on("mouseout", mouseOutCell)
                .on("click", function(d) {return zoom((node === d.parent ? root : d.parent),(d3.select(this).attr("id")),(d3.select(this).attr("parent"))); })
                .on("dblclick", function(d){remakeFlag = false;return sendAudit((d3.select(this).attr("id")),(d3.select(this).attr("parent")));});
            cell.attr("class", "cell").transition().duration(500)
                .attr("id", function(d){return d.name;})
                .attr("parent",function(d){return d.parent.name;})
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; }) ;
            cell.select("text").remove();
            cell.append("rect");            //creates as many blank texts and rects as are needed
            cell.append("text");
            cell.select("rect").transition().duration(500)
                .attr("width", function(d) { return d.dx - 1; })
                .attr("height", function(d) { return d.dy - 1; })
                .style("fill", function(d) { return color(d.parent.name);});
            cell.select("text")
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2; })
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("width", function(d) { return d.dx - 1; })
                .each(function (d) {            //truncates text with ... if rects are too small for the whole text
                    var nameholder = null;
                    var getWidth = d.dx;
                    var getHeight = d.dy;
                    if (d.name.length > (getWidth)*.1 ) {
                        if((getWidth)*.1 > 5 && 4 < (getHeight)*.1)nameholder = d.name.substring(0,(getWidth*.1)) + "... " + d.size;
                        else nameholder = " ";          //makes no text appear if cell is too small
                    }
                    else nameholder = d.name + " " + d.size;
                    var arr = nameholder.split(" ");
                    if (arr !== undefined) {            //places text into tspans for multi-line data
                        for (i = 0; i < arr.length; i++) {
                            d3.select(this).append("tspan")
                                .text(arr[i])
                                .attr("dy", i ? "1.2em" : 0)
                                .attr("y", function(d) { return d.dy / 2; })
                                .attr("x", function(d) { return d.dx / 2; })
                                .attr("text-anchor", "middle")
                                .attr("class", "tspan" + i);
                        }
                    }
                });
                cell.exit().remove();
                if(zoomFlag){               //hides visibility of zooming buttons on recreation
                    if(scope.treemapSaver.customZoomed === undefined){
                        d3.select("#zoomOut").transition().duration(750).style("opacity","0");
                        d3.select("#zoomIn").transition().duration(750).style("opacity","0");
                        d3.select("#zoomOut").on("click", "").style("cursor","auto");
                        d3.select("#zoomIn").on("click", "").style("cursor","auto");
                    }
                }
            }
            else{       //if the scope was preserved
                remakeFlag = false;
                zoomFlag=false;
                zoomFlag2=false;
                var newSvg = document.getElementById("treemapSVG");
                for(var i = 0; i < scope.treemapSaver.data.length; i++){        //appends old DOM elements into new DOM
                    newSvg.appendChild(scope.treemapSaver.data[i]);
                }
                scope.treemapSaver.data = undefined;
                var newCell = d3.selectAll("g.cell");        //add lost functionality
                  newCell.on("mouseover", mouseOverCell)
                      .on("mouseout", mouseOutCell)
                      .on("click", function(d) { return zoom((node === d.parent ? root : d.parent),(d3.select(this).attr("id")),(d3.select(this).attr("parent"))); })
                      .on("dblclick", function(d){return sendAudit((d3.select(this).attr("id")),(d3.select(this).attr("parent")));});          
                var z = 0;
                newCell.select("tspan")         
                    .text(function (d) {            //text truncation again
                        var nameholder = null;
                        var getWidth =  scope.treemapSaver.wordLength[z];
                        z++;
                        if (d.name.length > (getWidth)*.1) {
                            nameholder = d.name.substring(0,(getWidth)*.1) + "... " + d.size;
                        }
                        else nameholder = d.name + " " + d.size;
                        var arr = nameholder.split(" ");
                        return arr[0];
                    });                    
                $("#zoomOut").d3Click();
                scope.treemapSaver.customZoomed = undefined;
                d3.select("#zoomOut").style("display","block");
            }
        }
        else{           //shows message if no data is present
            svg.selectAll("rect").remove();
            svg.selectAll("text").remove();
            svg.append("text").attr("x", w/3).attr("y", h/3).text("No Data Available");
        }
        

        function zoom(d, name, parent, resize) {            //function for zooming in
            var kx = w / d.dx, ky = h / d.dy;
            if(name !== "0")document.getElementById('legendSelect').value = parent;
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);
            var auditParam=null;
            auditParam = parent + "." + name;       //string to send to audit service
            if(auditParam === "0.0")headerFlag = true;
            if((name !== "flag" && parent !== "flag")){     //checks if zoomout was not clicked
                zoomInTreemap(d,name,parent, kx, ky);
            }
            else{           //zoom out button clicked
                zoomOutTreemap(d,name,parent, kx);
            }    
            var widthSaver=0;
            var t = svg.selectAll("g.cell").transition()        //standard zoom out transitions
                .duration(750)
                .attr("transform", function(d) {widthSaver=x(d.x); return "translate(" + x(d.x) + "," + y(d.y) + ")";});  
            t.select("rect")
                .attr("width", function(d) {return kx * d.dx - 1; })
                .attr("height", function(d) { return ky * d.dy - 1; });
            t.select("text")
                .attr("x", function(d) { return kx * d.dx / 2; })
                .attr("y", function(d) { return ky * d.dy / 2; });
                //.style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });
            t.selectAll("tspan")
                .attr("x", function(d) { return kx * d.dx / 2; })
                .attr("y", function(d) { return ky * d.dy / 2; });          
        };
        function zoomInTreemap(d, name, parent, kx, ky){
            scope.treemapSaver.currentZoomName = name;
            scope.treemapSaver.firstZoom = true;
            d3.select("#zoomOut").transition().duration(750).style("opacity","1");
            d3.select("#zoomIn").transition().duration(750).style("opacity","1");
            d3.select("#zoomOut").on("click", function() { zoom(root, "flag", "flag"); }).style("cursor","pointer");
            d3.select("#zoomIn").on("click", customZoomBtn).style("cursor","pointer");
            d3.select("#zoomOut").style("cursor","pointer");
            d3.select("#zoomIn").style("cursor","pointer");
            var zx = 0;
            d3.selectAll("g.cell").select("tspan")
                .text(function(d) {         //text truncation check
                    var nameholder = null;
                    var getWidth = kx * d.dx - 1;
                    scope.treemapSaver.wordLength[zx] = (getWidth);
                    zx++;
                    if (d.name.length > (getWidth)*.1) {
                        nameholder = d.name.substring(0,(getWidth*.1)) + "... ";
//                            if((getWidth)*.1 > 5)nameholder = d.name.substring(0,(getWidth*.1)) + "... ";
//                            else nameholder = " ";
                    }
                    else nameholder = d.name;
                return nameholder;});
            d3.selectAll("g.cell").select("text").select("tspan:nth-child(2)")
                .text(function(d){return d.size;});

            d3.selectAll("g.cell").select("text")       //sets cell text to invisible when cell is too small
                .style("opacity", function(d){
                    var getWidth = kx * d.dx - 1;
                    var getHeight = ky * d.dy - 1;
                    if (5 > (getWidth)*.1 || 4 > (getHeight)*.1) {
                        return 0;
                    }else{
                        return 1;
                    }
                });                   
            d3.selectAll("g.cell")          //replaces click event to zoom in on individual cells once within a parent node
                .on("click", function(d) { return zoom((node === d.parent ? root : d.parent),(d3.select(this).attr("id")),(d3.select(this).attr("parent"))); });
            scope.treemapSaver.envSave = scope.env;
            zoomFlag = true; 
            tempName = name;
        };
        function zoomOutTreemap(d, name, parent, kx){
            svg = d3.selectAll("#treemapZoom").selectAll("div").selectAll("#treemapSVG");
            document.getElementById("legendSelect").selectedIndex = 0;
            scope.treemapSaver.zoomClicked = undefined;
            scope.treemapSaver.firstZoom = undefined;
            d3.selectAll(".brush").call(brushStorage[scope.treemapSaver.brushCounter].clear());
            d3.selectAll("g.brush").remove();
            d3.selectAll("g.cell").select("text").remove();
            d3.select("#zoomOut").transition().transition().duration(750).style("opacity","0");
            d3.select("#zoomIn").transition().transition().duration(750).style("opacity","0");
            d3.select("#zoomOut").on("click", "").style("cursor","auto");
            d3.select("#zoomIn").on("click", "").style("cursor","auto");
            scope.treemapSaver.customZoomed = undefined;
            d3.selectAll("g.cell").append("text").attr("x", function(d) { return d.dx / 2; })  //return text to original
                .attr("y", function(d) { return d.dy / 2; })
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("width", function(d) { return d.dx - 1; })
                .each(function (d) {
                    var nameholder = null;
                    var getWidth = d.dx;
                    var getHeight = d.dy;
                    if (d.name.length > (getWidth)*.1) {
                        //nameholder = d.name.substring(0,(getWidth*.1)) + "... " + d.size;
                        if((getWidth)*.1 > 5 && 4 < (getHeight)*.1)nameholder = d.name.substring(0,(getWidth*.1)) + "... " + d.size;
                        else nameholder = " ";
                    }
                    else nameholder = d.name + " " + d.size;
                    var arr = nameholder.split(" ");
                    if (arr !== undefined) {
                        for (i = 0; i < arr.length; i++) {
                            d3.select(this).append("tspan")
                                .text(arr[i])
                                .attr("dy", i ? "1.2em" : 0)
                                .attr("y", function(d) { return d.dy / 2; })
                                .attr("x", function(d) { return d.dx / 2; })
                                .attr("text-anchor", "middle")
                                .attr("id","new")
                                .attr("class", "tspan" + i);
                        };
                    }
                });
            d3.selectAll("g.cell")      //return click event to original
                .on("click", function(d) { return zoom((node === d.parent ? root : d.parent),(d3.select(this).attr("id")),(d3.select(this).attr("parent"))); });
            remakeFlag = true;
            if(headerFlag){
                $("#"+tempName).d3Click();
                $("#zoomOut").d3Click();
                headerFlag=false;
            }
            if(resized === true){
                if(!zoomFlag){//&&!zoomFlag2){      //if a single cell is zoomed in on, clicks the cell once after zooming out
                    $("#"+tempName).d3Click();  //to return to the parent node
                }
            }
            if(zoomFlag2)zoomFlag2 = false;
            zoomFlag = false;
        };
        function zoomOutBrushed(){          //sets all necessary values back to normal when leaving a custom zoom
            d3.selectAll(".brush").call(brushStorage[scope.treemapSaver.brushCounter].clear());
            d3.selectAll("g.brush").remove();
            d3.selectAll("svg.newSVG").remove();
            $("#zoomOut").d3Click();
            $("#"+scope.treemapSaver.currentZoomName).d3Click();
            d3.select("#zoomIn").style("cursor","pointer");
            d3.selectAll("#treemapSVG").transition().duration(750).style("opacity","1").style("display","inline");
            d3.select("#zoomOut").on("click", function() { zoom(root, "flag", "flag"); });
        };
        function brushed() {                //function for custom zooming
            var extent = null;
            scope.treemapSaver.dropdownClicked = false;
            if(d3.selectAll("#newSvg")[0].length === 0){            //gets area of box drawn
               extent = brushStorage[scope.treemapSaver.brushCounter].extent();
            }
            else{
                extent = brush1.extent();
            }
            var area = "("+extent[0][0]+", "+extent[0][1]+") ("+extent[1][0]+", "+extent[1][1]+")";
            var selected = null;
            var newSVGFlag = false;
            if(d3.selectAll("#newSvg")[0].length === 0){            //checks for initial custom zoom
                selected = d3.select("#treemapSVG").selectAll("g").data(scope.treemapSaver.nodeSaver)
                .select(function(d){
                    return (((((d.x+d.dx) > extent[0][0] && d.x  < extent[1][0]))) && 
                    ((d.y+d.dy) > extent[0][1] && d.y  < extent[1][1]))? this : null;
                });
            }
            else{                                                   //further custom zooms
                selected = d3.select("svg.newSVG").selectAll("g.cell").data(nodes)
                .select(function(d){
                    return (((((d.x+d.dx) > extent[0][0] && d.x  < extent[1][0]))) && 
                    ((d.y+d.dy) > extent[0][1] && d.y  < extent[1][1]))? this : null;
                });
                d3.selectAll("svg.newSVG").remove();
            }
            var tempSel = [];
            var tempSelCounter = 0;
            for(var p = 0; p < selected[0].length; p++){        //takes care of any null entries
                if(selected[0][p] !== null){
                    tempSel[tempSelCounter] = selected[0][p];
                    tempSelCounter++;
                }
            }
            selected = tempSel;
            scope.treemapSaver.gCounter = tempSelCounter;
                scope.treemapSaver.svgCounter++;
            var newerSVG = d3.selectAll("#treemapZoom").select("div")
                    .append("svg").attr("class","newSVG").attr("id","newSvg")
                    .attr("width",w).attr("height",h);
            for(var i = 0; i < selected[0].length; i++){        //appends old DOM elements into new DOM
                newerSVG.append(function(){return selected[0][i];});
            }
            console.log(area, selected);
            var childTextGet = null;
            if(!newSVGFlag) childTextGet = selected[0].childNodes.length-1;
            treeData = {name:"tree", children:[{}]};
            var isIE = getInternetExplorerVersion();
            for(var b = 0; b < selected.length; b++){               //restructures data into treemap friendly format
                childTextGet = selected[b].childNodes.length-1;
                if(isIE === -1){
                    treeChildren[b] = ({size:selected[b].childNodes[childTextGet].childNodes[1].innerHTML, name:selected[b].id });
                }else{
                    treeChildren[b] = ({size:selected[b].childNodes[childTextGet].childNodes[1].textContent, name:selected[b].id });
                }
                
            }
            treeData.children[0] = ({children:treeChildren, name:selected[0].__data__.parent.name});   
            treeChildren = [{}];
            d3.selectAll(".brush").call(brushStorage[scope.treemapSaver.brushCounter].clear());     //cleans out brush data
            d3.selectAll("g.brush").remove();

            d3.selectAll("#treemapZoom")                                    //hides original treemap
                .selectAll("div")
                .select("#treemapSVG")
                .style("opacity","0")
                .style("display","none");

            remakeFlag = true;

            scope.treemapSaver.customZoomed = true;
            scope.treemapSaver.brushCounter++;

            svg = d3.selectAll("#treemapZoom")              //changes svg selection to new svg
                    .selectAll("div").select("#treemapSVG");
            scope.treemapSaver.zoomClicked = undefined;
            createZoomTree(treeData, element, "true", scope, true);
            d3.select("#zoomOut").on("click", function() { zoomOutBrushed(); });
            d3.select("#zoomIn").style("cursor","pointer");
        };
        function getInternetExplorerVersion()
        {
          var rv = -1;
          if (navigator.appName === 'Microsoft Internet Explorer')
          {
            var ua = navigator.userAgent;
            var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) !== null)
              rv = parseFloat( RegExp.$1 );
          }
          else if (navigator.appName === 'Netscape')
          {
            var ua = navigator.userAgent;
            var re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) !== null)
              rv = parseFloat( RegExp.$1 );
          }
          return rv;
        }
        function customZoomBtn(){                           //handles deleting or creating new brush
            if(scope.treemapSaver.zoomClicked !== undefined){
                d3.selectAll(".brush").call(brushStorage[scope.treemapSaver.brushCounter].clear());
                d3.selectAll("g.brush").remove();
                scope.treemapSaver.zoomClicked = undefined;
                d3.select("#zoomIn").style("cursor","pointer");
            }
            else{
                d3.selectAll(".brush").call(brushStorage[scope.treemapSaver.brushCounter].clear());
                d3.selectAll("g.brush").remove();
                d3.select("#zoomIn").style("cursor","crosshair");
                if(scope.treemapSaver.customZoomed === undefined){
                    svg.append("g")
                        .attr("id","brush")
                        .attr("class", "brush")
                        .style("opacity",".4")
                        .call(brushStorage[scope.treemapSaver.brushCounter]);
                }
                else{
                    svg.append("g").attr("id","brush")
                        .attr("class", "brush").style("opacity",".4")
                        .call(brush1);
                }
                scope.treemapSaver.zoomClicked = true;
            }
        }; 
        function sendAudit(parent, name){       //sends audits directly instead of through controller function
            scope.treemapSaver.data = d3.select("#treemapZoom").select("svg").selectAll("g")[0];
            var interfaceQuery = '{"application":"'+name+'","interface1":"'+parent+'","timestamp":{"$gte":{"$date":"'+scope.fromDate+'"},"$lt":{"$date":"'+scope.toDate+'"}},"$and":[{"severity":{"$ne":"null"}},{"severity":{"$exists":"true","$ne":""}}]}';
            if(scope.newFilter){
                interfaceQuery = '{'+scope.newFilter+'"application":"'+name+'","interface1":"'+parent+'","timestamp":{"$gte":{"$date":"'+scope.fromDate+'"},"$lt":{"$date":"'+scope.toDate+'"}},"$and":[{"severity":{"$ne":"null"}},{"severity":{"$exists":"true","$ne":""}}]}';
            }
            scope.auditQuery.query(interfaceQuery, scope);
            scope.$apply($location.path("/audits"));
            return;
        };
    }
    function mouseOverCell(d) {
        d3.select(this).style("opacity", .8);
    };
    function mouseOutCell(){
        d3.select(this).style("opacity", 1);
    };
    jQuery.fn.d3Click = function () {       //zoom out after single cell zoom function
        this.each(function (i, e) {
            setTimeout(
            function() 
            {var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            e.dispatchEvent(evt);}, 1);
        });
    };
    function link(scope, element){
        scope.$watch('treemapPromise', function(){
            scope.treemapPromise.then(function(getCall){ //handles the promise
                if(getCall.data._size === 0){
                    scope.treemapSaver.resizeTemp = 0;
                    createZoomTree(0, element, "true", scope, true);
                    return;
                }
                var temp = getCall.data._embedded['rh:doc'];
                scope.treemapSaver.resizeTemp = temp;
                //handles the data format
                createZoomTree(temp, element, "true", scope, true); //("selects id of the graph in html","takes new data", "appends to the element", "calls the graph rendering function"
            });
            $(window).resize(function(){
               updateSize(scope.treemapSaver.resizeTemp, element, scope);
            });
        });
    }
    return { 
        restrict: 'E',
        link: link,
        controller: 'treemapController'
    };
}]);
