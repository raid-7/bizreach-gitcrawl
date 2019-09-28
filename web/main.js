$(document).ready(function() {
    let highlightedCompetence = {index : null, fixed : false};
    let savedCompetence = null;
    let lastUsername = null;

    let progressStatus = {
        current: 0,
        target: 0
    };
    let selectedRepoElem = null;

    setInterval(function() {
        if (progressStatus.current != progressStatus.target) {
            let diff = progressStatus.target - progressStatus.current;
            progressStatus.current += Math.min(4 * Math.sign(diff), diff);
        } else if (progressStatus.target == 100) {
            progressStatus.target = 0;
        }
        if (progressStatus.current > progressStatus.target)
            progressStatus.current = progressStatus.target;
        document.querySelector("#username .progressbar").style.width = progressStatus.current + "%";
    }, 40);

    function highlightCompetence(index, fixed) {
        if (highlightedCompetence.index === index && highlightedCompetence.fixed == fixed)
            return;

        if (index === null || index === undefined) {
            // hide
            if (savedCompetence) {
                highlightedCompetence = {index: savedCompetence.index, fixed: savedCompetence.fixed};
            } else {
                highlightedCompetence.index = null;
                highlightedCompetence.fixed = false;
            }
        } else {
            // show
            if (highlightedCompetence.fixed)
                savedCompetence = {index: highlightedCompetence.index, fixed: highlightedCompetence.fixed};
            highlightedCompetence.index = index;
            highlightedCompetence.fixed = fixed;
        }

        if (highlightedCompetence.index === null || index === undefined)
            $("#content .detailed-info").hide();
        else {
            let cont = $("#content .detailed-info .framework-info");
            cont.children().remove();

            for (let v of Object.getOwnPropertyNames(highlightedCompetence.index)) {
                if (Array.isArray(highlightedCompetence.index[v]))
                    continue;
                let expireienceValue = Math.round(parseFloat(highlightedCompetence.index[v]) * 100);
                cont.append('<div>' + v + ": " + expireienceValue + '</div>');
            }
            makeRepos(lastUsername, highlightedCompetence.index['repos']);
            $("#content .detailed-info").show();
        }
    }

    function uiRepo(username, repoName) {
        if (selectedRepoElem && selectedRepoElem.text() == repoName)
            return selectedRepoElem;

        let el = $('<div class="repo-item">' + repoName + '</div>');
        el.on('click', function() {
            loadRepoComplexities(username, repoName);
            el.addClass('selected');
            if (selectedRepoElem) {
                selectedRepoElem.removeClass("selected");
            }
            selectedRepoElem = el;
        });
        return el;
    }

    function makeRepos(username, repos) {
        let cont = $('.repo-info');
        cont.children().remove();
        for (let repo of repos) {
            let repoElem = uiRepo(username, repo);
            cont.append(repoElem);
        }
    }

    function makeEngineerPie(competences) {
        let pieCont = $("#engineer-pie-container");
        if (!competences) {
            pieCont.children().remove();
            return;
        }
        pieCont.append($('<canvas id="engineer-pie" width="400" height="400"></canvas>'));
        let ctx = document.getElementById('engineer-pie');

        let cColors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
        ];

        data = [];
        labels = []
        let i = 0;
        for (p of Object.getOwnPropertyNames(competences)) {
            let area = competences[p];
            data[i] = Object.getOwnPropertyNames(area)
                .filter((v) => !Array.isArray(area[v]))
                .map((v) => parseFloat(area[v]));
            data[i] = data[i].reduce((a, b) => a + b, 0);
            data[i] = Math.round(data[i] * 100);
            labels[i] = p;
            i++;
        }

        let chart = new Chart(ctx, {
            data: {
                datasets : [{
                    data: data,
                    backgroundColor: cColors.slice(0, data.length)
                }],
                labels: labels
            },
            type: 'pie',
            options: {
                responsive: false,
                onHover: function(x, y) {
                    if (y.length > 0)
                        highlightCompetence(competences[labels[y[0]._index]], x.type == "click");
                    else
                        highlightCompetence(null, x.type == "click");
                }
            }
        });
    }

    function makeUserInfo(data) {
        if (data) {
            let imgnameElem = $('<div></div>');
            imgnameElem.append($('<img src="' + data.avatar + '">'));
            if (data.name) {
                let nameElem = $('<h4></h4>');
                nameElem.text(data.name);
                nameElem.html(nameElem.html().trim().replace(/\s+/, "<br>"));
                imgnameElem.append(nameElem);
            }
            $("#content .user-info")
                .append(imgnameElem)
                .append($('<div>' + data.n_repos + ' REPOSITORIES</div>'))
                .append($('<div>' + data.n_commits + ' COMMITS</div>'))
                .show();
        } else {
            $("#content .user-info").hide().children().remove();
        }
    }

    function makeRepoComplexities(cmpx) {
        let width = 600;
        let height = 300;
        let i = 0;

        const root = d3.pack(cmpx)
            .size([width - 2, height - 2])
            .padding(3)
        (d3.hierarchy({children: cmpx})
            .sum(d => d.complexity));
        console.log(cmpx, root);

        const svg = d3.create("svg")
          .attr("viewBox", [0, 0, width, height])
          .attr("font-size", 10)
          .attr("font-family", "sans-serif")
          .attr("text-anchor", "middle");

        const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
          .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);

        leaf.append("circle")
          .attr("id", d => (d.leafUid = ("" + i++)).id)
          .attr("r", d => d.r)
          .attr("fill-opacity", 0.7)
          .attr("fill", d => 'red');

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

        leaf.append("title")
          .text(d => `${d.data.title}\n${d.value}`);

        let chart = svg.node();

        let cont = $('#repo-complexities-container');
        cont.children().remove();
        cont.append(chart);

        svg.style.width = width + "px";
        svg.style.width = height + "px";
    }

    function loadUserNamePicture(username) {
        $.ajax("/info?user=" + username, {
            method: "GET",
            success: function(data) {
                makeUserInfo(data);
                progressStatus.target += 45;
            },
            error: function(data) {
                console.log(data);
            }
        });
        makeUserInfo(null);
    }

    function loadRepoComplexities(username, repo) {
        $.ajax('/complexities?user=' + username + '&repo=' + repo, {
            method: "GET",
            success: function(data) {
                progressStatus.target = 100;
                res = [];
                for (let filename of Object.getOwnPropertyNames(data))
                    for (let classname of Object.getOwnPropertyNames(data[filename])) {
                        res.push({
                            "name" : classname,
                            "complexity" : data[filename][classname]['~proper~']
                        });
                    }
                makeRepoComplexities(res);
            },
            error: function(data) {
                console.log(data);
            }
        });
        progressStatus.target = 50;
    }

    function loadUserPie(username) {
        $.ajax("/best_skills?user=" + username, {
            method: "GET",
            success: function(data) {
                console.log(data);
                makeEngineerPie(data);
                progressStatus.target += 45;
            },
            error: function(data) {
                console.log(data);
            }
        });
        makeEngineerPie(null);
    }

    function loadUserInfo(username) {
        if (lastUsername == username || !username)
            return;
        lastUsername = username;
        progressStatus.target = 10;

        selectedRepoElem = null;

        loadUserNamePicture(username);
        loadUserPie(username);
    }

    let usernameInput = $('#username input');
    usernameInput.on("keydown", function(ev) {
        if (ev.keyCode == 13)
            loadUserInfo(usernameInput.val());
    });
    usernameInput.focusout(function(ev) {
       loadUserInfo(usernameInput.val()); 
    });
    usernameInput.focus();
});
