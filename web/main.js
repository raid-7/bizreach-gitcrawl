$(document).ready(function() {
    let highlightedCompetence = {index : null, fixed : false};
    let savedCompetence = null;
    let lastUsername = null;

    let progressStatus = {
        current: 0,
        target: 0
    };

    setInterval(function() {
        if (progressStatus.current != progressStatus.target) {
            let diff = progressStatus.target - progressStatus.current;
            progressStatus.current += Math.min(4 * Math.sign(diff), diff);
        } else if (progressStatus.target == 100) {
            progressStatus.target = 0;
            progressStatus.current = 0;
        } else return;
        document.querySelector("#username .progressbar").style.width = progressStatus.current + "%";
    }, 40);

    function highlightCompetence(index, fixed) {
        if (highlightedCompetence.index === index && highlightedCompetence.fixed == fixed)
            return;

        if (index === null) {
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

        console.log(highlightedCompetence, savedCompetence);

        if (highlightedCompetence.index === null)
            $("#content .detailed-info").hide();
        else {
            let cont = $("#content .detailed-info .framework-info");
            cont.children().remove();
            for (let v of Object.getOwnPropertyNames(highlightedCompetence.index)) {
                cont.append('<div>' + v + ": " + highlightedCompetence.index[v] + '</div>');
            }
            $("#content .detailed-info").show();
        }
    }

    function makeEngineerPie(competences) {
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
            data[i] = Object.getOwnPropertyNames(area).map((v) => parseInt(area[v])).reduce((a, b) => a + b, 0);
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
        $("#content .user-info")
            .append($('<div><img src="' + data.picture + '"><h4>' + data.name.replace(/\s+/, "<br>") + '</h4></div>'))
            .append($('<div>' + data.num_repos + ' REPOSITORIES</div>'))
            .append($('<div>' + data.num_commits + ' COMMITS</div>'))
            .show();
    }

    function loadUserNamePicture(username) {
        makeUserInfo({
            picture: "https://avatars3.githubusercontent.com/u/5462697?s=460&v=4",
            name: "Victor Krapivenskiy",
            num_repos: 13,
            num_commits: 340
        });
    }

    function loadUserInfo(username) {
        if (lastUsername == username)
            return;
        lastUsername = username;

        loadUserNamePicture();
        makeEngineerPie({
            "Backend" : {
                "Spark" : 5,
                "Spring" : 10
            },
            "Desktop" : {
                "Swing" : 8,
                "AWT" : 12
            },
            "Frontend" : {
                "GWT" : 34
            },
            "Mobile" : {
                "Android" : 2
            },
            "Machine Learning" : {
                "Flink" : 50,
                "Mahout" : 20,
                "Spark" : 20,
                "Deeplearning4j" : 3
            }
        });
    }

    let usernameInput = $('#username');
    usernameInput.on("keydown", function(ev) {
        if (ev.keyCode == 13)
            loadUserInfo(usernameInput.text());
    });
    usernameInput.focusout(function(ev) {
       loadUserInfo(usernameInput.text()); 
    });
    usernameInput.focus();
});
