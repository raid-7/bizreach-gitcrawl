function buildComplexityGraph(cmpx) {
    let width = 800;
    let height = 300;
    let i = 0;

    let mean = 0;
    for (let c of cmpx) {
        console.log(c);
        mean += c.complexity;
    }
    mean /= cmpx.length;

    let cmpxChanged = cmpx.map((c) => ({
        name: (c.complexity > mean / 2 ? c.name : ""),
        complexity: c.complexity
    }));
    
    const root = d3.pack(cmpxChanged)
        .size([width - 2, height - 2])
        .padding(8)
    (d3.hierarchy({children: cmpxChanged})
        .sum(d => d.complexity)
        .sort((a, b) => b.value - a.value));
    console.log(cmpx, root);

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "10px sans-serif")
        .attr("text-anchor", "middle");

    const shadow = ("" + i++);

    svg.append("filter")
        .attr("id", shadow.id)
        .append("feDropShadow")
        .attr("flood-opacity", 0.3)
        .attr("dx", 0)
        .attr("dy", 1);

    const node = svg.selectAll("g")
        .data(d3.nest().key(d => d.height).entries(root.descendants()))
        .join("g")
        .attr("filter", shadow)
        .selectAll("g")
        .data(d => d.values)
        .join("g")
        .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);

    node.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => ['red', 'green', 'yellow'][Math.floor(Math.random() * 3)]);

    const leaf = node.filter(d => !d.children);
     
    leaf.select("circle")
        .attr("id", d => (d.leafUid = ("" + i++)).id);

    leaf.append("clipPath")
        .attr("id", d => (d.clipUid = ("" + i++)).id)
        .append("use")
        .attr("xlink:href", d => d.leafUid.href);

    leaf.append("text")
        .attr("clip-path", d => d.clipUid)
        .selectAll("tspan")
        .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .text(d => d);

    node.append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${d.value}`);
        
    return svg.node();
}