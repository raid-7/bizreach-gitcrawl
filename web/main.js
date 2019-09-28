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
            savedCompetence = null;
            pieCont.children().remove();
            $("#right-panel .detailed-info .framework-info").children().remove();
            $("#right-panel .detailed-info .repo-info").children().remove();
            $("#repo-complexities-container").children().remove();
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
            $("#content .detailed-info").hide();
        }
    }

    function makeRepoComplexities(cmpx) {
        let cont = $('#repo-complexities-container');
        cont.children().remove();
        if (!cmpx.length) {
            cont.html("<span>Kotlin repository</span>");
            return;
        }

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
        console.log(cmpxChanged);

        const root = d3.pack(cmpxChanged)
            .size([width - 2, height - 2])
            .padding(8)
        (d3.hierarchy({children: cmpxChanged})
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
        cont.append(chart);

        chart.style.width = width + "px";
        chart.style.height = height + "px";
    }

    function loadUserNamePicture(username) {
        $.ajax("/info?user=" + username, {
            method: "GET",
            success: function(data) {
                if (lastUsername != username)
                    return;

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
                if (lastUsername != username)
                    return;

                progressStatus.target = 100;
                res = [];
                for (let filename of Object.getOwnPropertyNames(data))
                    for (let classname of Object.getOwnPropertyNames(data[filename])) {
                        if (classname.indexOf('$') >= 0)
                            continue;

                        if (data[filename][classname]['~proper~'])
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
                if (lastUsername != username)
                    return;
                
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

    (function() {
        let data = {
          "src/ru/raid/signal/v2/ConcatPresenter.java": {
            "ConcatPresenter": {
              "ConcatPresenter": 3, 
              "getSampleRate": 3, 
              "getTimeOffset": 1, 
              "hasNext": 3, 
              "next": 4, 
              "~proper~": 3
            }
          }, 
          "src/ru/raid/signal/v2/QueuePresenter.java": {
            "QueuePresenter": {
              "QueuePresenter": 1, 
              "getSampleRate": 1, 
              "getTimeOffset": 1, 
              "hasNext": 1, 
              "next": 3, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/SignalImpl.java": {
            "SignalImpl": {
              "SignalImpl": 1, 
              "addFilter": 2, 
              "addListener": 1, 
              "addNext": 5, 
              "addWeakListener": 1, 
              "available": 1, 
              "cut": 1, 
              "filter": 1, 
              "getData": 1, 
              "getSamplePeriod": 1, 
              "getSampleRate": 1, 
              "getSource": 1, 
              "getTimeOffset": 1, 
              "handle": 10, 
              "invokeListenersOnFiltered": 4, 
              "invokeListenersOnNext": 4, 
              "pack": 1, 
              "removeFilter": 2, 
              "removeListener": 1, 
              "transform": 1, 
              "update": 4, 
              "~proper~": 29
            }
          }, 
          "src/ru/raid/signal/v2/SignalPresenter.java": {
            "SignalPresenter": {
              "SignalPresenter": 1, 
              "getSampleRate": 1, 
              "getTimeOffset": 1, 
              "hasNext": 1, 
              "next": 3, 
              "onNextSample": 1, 
              "onSampleFiltered": 2, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/StaticPresenter.java": {
            "StaticPresenter": {
              "StaticPresenter": 1, 
              "getSampleRate": 1, 
              "getTimeOffset": 1, 
              "hasNext": 1, 
              "next": 3, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/chart/BasicColorTable.java": {
            "BasicColorTable": {
              "BasicColorTable": 1, 
              "getColor": 1, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/chart/Chart.java": {
            "Chart": {
              "Chart": 1, 
              "addSignal": 1, 
              "allocate": 2, 
              "channelsCount": 2, 
              "clearSignals": 2, 
              "computeXRange": 5, 
              "computeYRange": 7, 
              "getData": 1, 
              "getXName": 1, 
              "getXRange": 1, 
              "getXRangeCharacteristic": 1, 
              "getYName": 1, 
              "getYRange": 1, 
              "reload": 3, 
              "removeSignal": 1, 
              "setXName": 1, 
              "setXRange": 1, 
              "setYName": 1, 
              "setYRange": 1, 
              "update": 3, 
              "~proper~": 4
            }, 
            "Chart$Listener": {
              "onNextSample": 1, 
              "onSampleFiltered": 1
            }, 
            "Chart$XRangeCharacteristic": {
              "XRangeCharacteristic": 1, 
              "getMax": 1, 
              "getMin": 1, 
              "getPeriod": 1
            }
          }, 
          "src/ru/raid/signal/v2/chart/ChartDrawer.java": {
            "ChartDrawer": {
              "ChartDrawer": 1, 
              "calcXLinePos": 3, 
              "calcYLinePos": 3, 
              "computeDrawArea": 3, 
              "getChart": 1, 
              "innerPaint": 2, 
              "paintChartChannel": 4, 
              "paintComponent": 2, 
              "paintGrid": 8, 
              "paintMainAxis": 3, 
              "paintPrepare": 2, 
              "recompute": 1, 
              "setChart": 1, 
              "setViewSettings": 1, 
              "~proper~": 34
            }
          }, 
          "src/ru/raid/signal/v2/chart/ChartView.java": {
            "ChartView": {
              "ChartView": 1, 
              "drawAxisNames": 1, 
              "drawGrid": 1, 
              "drawMainAxis": 1, 
              "drawNumbers": 1, 
              "getAxisNameColor": 1, 
              "getAxisNameFont": 1, 
              "getBackgroundColor": 1, 
              "getChannelColorTable": 1, 
              "getChartStroke": 1, 
              "getGridColor": 1, 
              "getGridStroke": 1, 
              "getMainAxisColor": 1, 
              "getMainAxisStroke": 1, 
              "getNumbersColor": 1, 
              "getNumbersFont": 1, 
              "getXGridStep": 1, 
              "getYGridStep": 1, 
              "setAxisNameColor": 1, 
              "setAxisNameFont": 1, 
              "setBackgroundColor": 1, 
              "setChannelColorTable": 1, 
              "setChartStroke": 1, 
              "setDrawAxisNames": 1, 
              "setDrawGrid": 1, 
              "setDrawMainAxis": 1, 
              "setDrawNumbers": 1, 
              "setGridColor": 1, 
              "setGridStep": 1, 
              "setGridStroke": 1, 
              "setMainAxisColor": 1, 
              "setMainAxisStroke": 1, 
              "setNumbersColor": 1, 
              "setNumbersFont": 1, 
              "setXGridStep": 1, 
              "setYGridStep": 1, 
              "~proper~": 19
            }
          }, 
          "src/ru/raid/signal/v2/chart/RandomColorTable.java": {
            "RandomColorTable": {
              "RandomColorTable": 1, 
              "generate": 2, 
              "getColor": 1, 
              "next": 1, 
              "~proper~": 5
            }
          }, 
          "src/ru/raid/signal/v2/chart/extended/Artist.java": {
            "Artist": {
              "Artist": 1, 
              "addDrawable": 1, 
              "addTactic": 1, 
              "clearDrawables": 1, 
              "clearTactics": 1, 
              "computeDrawArea": 2, 
              "computeRanges": 6, 
              "computeResolution": 3, 
              "paint": 2, 
              "paintTactics": 2, 
              "removeDrawable": 1, 
              "removeTactic": 1, 
              "repaint": 1, 
              "~proper~": 6
            }, 
            "Artist$DContext": {
              "getGraphics": 1, 
              "recompute": 1
            }, 
            "Artist$InnerContext": {
              "InnerContext": 1, 
              "getDrawArea": 1, 
              "getXRange": 1, 
              "getXResolution": 1, 
              "getYRange": 1, 
              "getYResolution": 1
            }
          }, 
          "src/ru/raid/signal/v2/chart/extended/ArtistPanel.java": {
            "ArtistPanel": {
              "ArtistPanel": 1, 
              "paintComponent": 1, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/chart/extended/DrawContext.java": {
            "DrawContext": {
              "recompute": 1
            }
          }, 
          "src/ru/raid/signal/v2/chart/extended/GridTactic.java": {
            "GridTactic": {
              "GridTactic": 1, 
              "calcXLinePos": 3, 
              "calcYLinePos": 3, 
              "draw": 1, 
              "drawAxisNames": 1, 
              "drawGrid": 1, 
              "drawMainAxis": 1, 
              "drawNumbers": 1, 
              "getAxisNameColor": 1, 
              "getAxisNameFont": 1, 
              "getBackgroundColor": 1, 
              "getChartStroke": 1, 
              "getGridColor": 1, 
              "getGridStroke": 1, 
              "getMainAxisColor": 1, 
              "getMainAxisStroke": 1, 
              "getNumbersColor": 1, 
              "getNumbersFont": 1, 
              "getXAxisName": 1, 
              "getXGridStep": 1, 
              "getYAxisName": 1, 
              "getYGridStep": 1, 
              "paintGrid": 7, 
              "paintMainAxis": 3, 
              "setAxisNameColor": 1, 
              "setAxisNameFont": 1, 
              "setBackgroundColor": 1, 
              "setChartStroke": 1, 
              "setDrawAxisNames": 1, 
              "setDrawGrid": 1, 
              "setDrawMainAxis": 1, 
              "setDrawNumbers": 1, 
              "setGridColor": 1, 
              "setGridStep": 1, 
              "setGridStroke": 1, 
              "setMainAxisColor": 1, 
              "setMainAxisStroke": 1, 
              "setNumbersColor": 1, 
              "setNumbersFont": 1, 
              "setXAxisName": 1, 
              "setXGridStep": 1, 
              "setYAxisName": 1, 
              "setYGridStep": 1, 
              "~proper~": 54
            }
          }, 
          "src/ru/raid/signal/v2/chart/extended/Range.java": {
            "Range": {
              "Range": 1, 
              "disjunction": 1, 
              "getMax": 1, 
              "getMin": 1, 
              "getRange": 1, 
              "toArray": 1, 
              "~proper~": 8
            }
          }, 
          "src/ru/raid/signal/v2/io/StreamRecorder.java": {
            "StreamRecorder": {
              "StreamRecorder": 1, 
              "getRecorder": 2, 
              "read": 1, 
              "write": 1, 
              "~proper~": 12
            }, 
            "StreamRecorder$StreamReader": {
              "StreamReader": 1, 
              "allocate": 2, 
              "allocateNext": 4, 
              "close": 1, 
              "getAdditionalPresenter": 1, 
              "getPresenter": 1, 
              "getStaticPresenter": 1, 
              "init": 2, 
              "readData": 2, 
              "readDouble": 1, 
              "readInt": 1, 
              "readLong": 1, 
              "readMetadata": 1, 
              "update": 3
            }, 
            "StreamRecorder$StreamWriter": {
              "StreamWriter": 1, 
              "allocate": 2, 
              "allocateNext": 1, 
              "begin": 1, 
              "close": 1, 
              "flush": 1, 
              "onNextSample": 1, 
              "onSampleFiltered": 2, 
              "writeDouble": 1, 
              "writeInt": 1, 
              "writeLong": 1, 
              "writeMetadata": 1, 
              "writeSample": 1, 
              "writeSamples": 2
            }
          }, 
          "src/ru/raid/signal/v2/tools/AvarageWindowFilter.java": {
            "AvarageWindowFilter": {
              "AvarageWindowFilter": 1, 
              "filter": 4, 
              "getAfterOffset": 1, 
              "getBeforeOffset": 1, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/tools/DerivatorFilter.java": {
            "DerivatorFilter": {
              "DerivatorFilter": 1, 
              "computeTimePower": 2, 
              "computeValueTimePowerSum": 2, 
              "filter": 5, 
              "getAfterOffset": 1, 
              "getBeforeOffset": 1, 
              "solveSystem": 2, 
              "~proper~": 7
            }
          }, 
          "src/ru/raid/signal/v2/tools/DiSPoFilter.java": {
            "DiSPoFilter": {
              "DiSPoFilter": 1, 
              "computeTimePower": 2, 
              "computeValueTimePowerSum": 2, 
              "filter": 5, 
              "getAfterOffset": 1, 
              "getBeforeOffset": 1, 
              "solveSystem": 2, 
              "~proper~": 7
            }
          }, 
          "src/ru/raid/signal/v2/tools/FourierTransformer.java": {
            "FourierTransformer": {
              "FourierTransformer": 1, 
              "allocate": 2, 
              "dftForward": 1, 
              "fftForward": 3, 
              "getSignal": 1, 
              "isEnabled": 1, 
              "recompute": 1, 
              "setEnabled": 3, 
              "~proper~": 2
            }, 
            "FourierTransformer$InnerSignal": {
              "InnerSignal": 1, 
              "available": 1
            }, 
            "FourierTransformer$Listener": {
              "onNextSample": 1, 
              "onSampleFiltered": 2
            }, 
            "FourierTransformer$Presenter": {
              "getSampleRate": 1, 
              "getTimeOffset": 1, 
              "hasNext": 1, 
              "next": 1, 
              "relax": 2
            }
          }, 
          "src/ru/raid/signal/v2/tools/FunctionalFilter.java": {
            "FunctionalFilter": {
              "FunctionalFilter": 1, 
              "filter": 1, 
              "getAfterOffset": 1, 
              "getBeforeOffset": 1, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/tools/HighPassFilteringTransformer.java": {
            "HighPassFilteringTransformer": {
              "HighPassFilteringTransformer": 1, 
              "getSignal": 1, 
              "isEnabled": 1, 
              "setEnabled": 3, 
              "~proper~": 1
            }, 
            "HighPassFilteringTransformer$InnerSignal": {
              "InnerSignal": 1, 
              "update": 1
            }, 
            "HighPassFilteringTransformer$Listener": {
              "onNextSample": 1, 
              "onSampleFiltered": 1
            }
          }, 
          "src/ru/raid/signal/v2/tools/LineGeneratorSource.java": {
            "LineGeneratorSource": {
              "LineGeneratorSource": 1, 
              "getSignal": 1, 
              "isEnabled": 1, 
              "setEnabled": 5, 
              "~proper~": 1
            }, 
            "LineGeneratorSource$Presenter": {
              "getSampleRate": 1, 
              "getTimeOffset": 1, 
              "hasNext": 1, 
              "next": 1
            }
          }, 
          "src/ru/raid/signal/v2/tools/LowPassFilter.java": {
            "LowPassFilter": {
              "LowPassFilter": 1, 
              "filter": 1, 
              "getAfterOffset": 1, 
              "getBeforeOffset": 1, 
              "~proper~": 1
            }
          }, 
          "src/ru/raid/signal/v2/tools/StaticGeneratorSource.java": {
            "StaticGeneratorSource": {
              "StaticGeneratorSource": 1, 
              "getSignal": 1, 
              "isEnabled": 1, 
              "setEnabled": 1, 
              "~proper~": 1
            }
          }
        };
        // res = [];
        // for (let filename of Object.getOwnPropertyNames(data))
        //     for (let classname of Object.getOwnPropertyNames(data[filename])) {
        //         if (data[filename][classname]['~proper~'])
        //             res.push({
        //                 "name" : classname,
        //                 "complexity" : data[filename][classname]['~proper~']
        //             });
        //     }
        // console.log(res);
        // makeRepoComplexities(res);
    })();
});
