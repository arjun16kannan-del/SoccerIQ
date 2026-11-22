const addMatchButton = document.querySelector(".welcome .add-match");
const matchModal = document.getElementById("match-modal");
const closeModalButton = document.getElementById("close-modal");
const matchForm = document.getElementById("match-form");
const historyContainer = document.getElementById("match-history");
const modalTitle = document.querySelector(".modal-header h2");
const submitMatchButton = matchForm.querySelector('button[type="submit"]');

let matches = JSON.parse(localStorage.getItem("soccerIQMatches")) || [];
let performanceChart = null;
let contributionsChart = null;
let editingMatchIndex = null;

function saveMatches() {
    localStorage.setItem("soccerIQMatches", JSON.stringify(matches));
}

function refreshDashboard() {
    saveMatches();
    updateDashboard();
    updatePerformanceOverview();
    updatePerformanceInsights();
    renderMatchHistory();
    updatePerformanceChart();
    updateContributionsChart();
}

function openAddMatchModal() {
    editingMatchIndex = null;
    matchForm.reset();
    modalTitle.textContent = "Add a Match";
    submitMatchButton.textContent = "Save Match";
    matchModal.hidden = false;
}

function closeMatchModal() {
    matchModal.hidden = true;
    editingMatchIndex = null;
    matchForm.reset();
    modalTitle.textContent = "Add a Match";
    submitMatchButton.textContent = "Save Match";
}

function renderMatchHistory() {
    const historyCount = document.getElementById("history-count");
    const emptyHistory = document.getElementById("empty-history");

    historyContainer.replaceChildren();

    historyCount.textContent = matches.length + (matches.length === 1 ? " match" : " matches");
    emptyHistory.hidden = matches.length > 0;

    matches.map(function(match, index) {
        return { match: match, index: index };
    }).reverse().forEach(function(item) {
        const match = item.match;
        const index = item.index;
        const row = document.createElement("tr");

        const passAccuracy = match.passesAttempted > 0
            ? Math.round((match.passesCompleted / match.passesAttempted) * 100) + "%"
            : "--";

        const values = [
            match.opponent,
            match.date,
            match.position,
            match.goals,
            match.assists,
            passAccuracy
        ];

        values.forEach(function(value) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionsCell = document.createElement("td");
        actionsCell.className = "match-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "edit-match";
        editButton.dataset.index = index;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-match";
        deleteButton.dataset.index = index;

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        historyContainer.appendChild(row);
    });
}

function updateDashboard() {
    const totalMatches = matches.length;

    const totalGoals = matches.reduce((sum, match) => sum + match.goals, 0);
    const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);
    const totalPasses = matches.reduce((sum, match) => sum + match.passesAttempted, 0);
    const completedPasses = matches.reduce((sum, match) => sum + match.passesCompleted, 0);

    const passAccuracy = totalPasses > 0
        ? Math.round((completedPasses / totalPasses) * 100)
        : null;

    document.getElementById("total-matches").textContent = totalMatches;
    document.getElementById("total-goals").textContent = totalGoals;
    document.getElementById("total-assists").textContent = totalAssists;

    document.getElementById("pass-accuracy").textContent =
        passAccuracy === null ? "--%" : passAccuracy + "%";
}

function updatePerformanceOverview() {
    const total = function(key) {
        return matches.reduce(function(sum, match) {
            return sum + (Number(match[key]) || 0);
        }, 0);
    };

    const count = matches.length;

    const averageGoals = count > 0
        ? (total("goals") / count).toFixed(1)
        : "0.0";

    const averageKeyPasses = count > 0
        ? (total("keyPasses") / count).toFixed(1)
        : "0.0";

    const averageDefensiveActions = count > 0
        ? ((total("tackles") + total("interceptions")) / count).toFixed(1)
        : "0.0";

    const totalShots = total("shots");
    const totalShotsOnTarget = total("shotsOnTarget");

    const shotAccuracy = totalShots > 0
        ? Math.round((totalShotsOnTarget / totalShots) * 100) + "%"
        : "--%";

    document.getElementById("avg-goals").textContent = averageGoals;
    document.getElementById("shot-accuracy").textContent = shotAccuracy;
    document.getElementById("avg-key-passes").textContent = averageKeyPasses;
    document.getElementById("avg-defensive-actions").textContent = averageDefensiveActions;
}

function updatePerformanceInsights() {
    const insightsContainer = document.getElementById("performance-insights");

    if (!insightsContainer) {
        return;
    }

    insightsContainer.replaceChildren();

    if (matches.length === 0) {
        const message = document.createElement("p");
        message.className = "placeholder";
        message.textContent = "Add matches to generate performance insights.";
        insightsContainer.appendChild(message);
        return;
    }

    const total = function(key) {
        return matches.reduce((sum, match) => sum + (Number(match[key]) || 0), 0);
    };

    const count = matches.length;
    const goalsAverage = total("goals") / count;
    const assistsAverage = total("assists") / count;
    const keyPassesAverage = total("keyPasses") / count;
    const defensiveAverage = (total("tackles") + total("interceptions")) / count;

    const shots = total("shots");
    const shotAccuracy = shots > 0 ? (total("shotsOnTarget") / shots) * 100 : null;

    const passes = total("passesAttempted");
    const passAccuracy = passes > 0 ? (total("passesCompleted") / passes) * 100 : null;

    const insights = [];

    if (goalsAverage >= 1) {
        insights.push({
            title: "Attacking Contribution",
            description: "You're averaging " + goalsAverage.toFixed(1) + " goals per match. You're making a consistent scoring contribution."
        });
    } else {
        insights.push({
            title: "Attacking Contribution",
            description: "You're averaging " + goalsAverage.toFixed(1) + " goals per match. Look at your positioning and opportunities to get involved in attacking areas."
        });
    }

    if (assistsAverage >= 0.5 || keyPassesAverage >= 2) {
        insights.push({
            title: "Chance Creation",
            description: "You're averaging " + assistsAverage.toFixed(1) + " assists and " + keyPassesAverage.toFixed(1) + " key passes per match. You're contributing to your team's attacking play."
        });
    } else {
        insights.push({
            title: "Chance Creation",
            description: "You're averaging " + keyPassesAverage.toFixed(1) + " key passes per match. Look for opportunities to create chances for teammates."
        });
    }

    if (passAccuracy !== null) {
        insights.push({
            title: "Passing",
            description: "Your overall pass accuracy is " + Math.round(passAccuracy) + "%. " +
                (passAccuracy >= 80
                    ? "You're maintaining a strong completion rate."
                    : "There may be opportunities to improve your passing consistency.")
        });
    }

    if (defensiveAverage >= 5) {
        insights.push({
            title: "Defensive Contribution",
            description: "You're averaging " + defensiveAverage.toFixed(1) + " tackles and interceptions combined per match. You're contributing defensively."
        });
    } else {
        insights.push({
            title: "Defensive Contribution",
            description: "You're averaging " + defensiveAverage.toFixed(1) + " defensive actions per match. Look for opportunities to win possession and disrupt opposition attacks."
        });
    }

    if (shotAccuracy !== null) {
        insights.push({
            title: "Shooting",
            description: "Your shot accuracy is " + Math.round(shotAccuracy) + "%. " +
                (shotAccuracy >= 50
                    ? "A good proportion of your attempts are reaching the target."
                    : "Consider focusing on shot selection and accuracy.")
        });
    }

    insights.forEach(function(insight) {
        const card = document.createElement("div");
        card.className = "insight-item";

        const heading = document.createElement("h4");
        heading.textContent = insight.title;

        const description = document.createElement("p");
        description.textContent = insight.description;

        card.appendChild(heading);
        card.appendChild(description);
        insightsContainer.appendChild(card);
    });
}

function updatePerformanceChart() {
    const chartCanvas = document.getElementById("pass-accuracy-chart");

    const chartLabels = matches.map(function(match) {
        return match.opponent;
    });

    const chartData = matches.map(function(match) {
        return match.passesAttempted > 0
            ? Math.round((match.passesCompleted / match.passesAttempted) * 100)
            : null;
    });

    if (performanceChart) {
        performanceChart.destroy();
    }

    performanceChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "Pass Accuracy",
                data: chartData,
                borderColor: "#65d68a",
                backgroundColor: "rgba(101, 214, 138, 0.15)",
                borderWidth: 3,
                pointBackgroundColor: "#65d68a",
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#c5d1c9"
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: "#819087",
                        callback: function(value) {
                            return value + "%";
                        }
                    },
                    grid: {
                        color: "#2b3c30"
                    }
                },
                x: {
                    ticks: {
                        color: "#819087"
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateContributionsChart() {
    const chartCanvas = document.getElementById("contributions-chart");

    const chartLabels = matches.map(function(match) {
        return match.opponent;
    });

    const goalsData = matches.map(function(match) {
        return match.goals;
    });

    const assistsData = matches.map(function(match) {
        return match.assists;
    });

    if (contributionsChart) {
        contributionsChart.destroy();
    }

    contributionsChart = new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: "Goals",
                    data: goalsData,
                    backgroundColor: "#65d68a",
                    borderRadius: 5
                },
                {
                    label: "Assists",
                    data: assistsData,
                    backgroundColor: "#5b9bd5",
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#c5d1c9"
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#819087",
                        stepSize: 1
                    },
                    grid: {
                        color: "#2b3c30"
                    }
                },
                x: {
                    ticks: {
                        color: "#819087"
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function editMatch(index) {
    const match = matches[index];

    if (!match) {
        return;
    }

    editingMatchIndex = index;

    Object.keys(match).forEach(function(key) {
        const field = matchForm.elements.namedItem(key);

        if (field) {
            field.value = match[key];
        }
    });

    modalTitle.textContent = "Edit Match";
    submitMatchButton.textContent = "Save Changes";
    matchModal.hidden = false;
}

function deleteMatch(index) {
    const match = matches[index];

    if (!match) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete the match against " + match.opponent + "?"
    );

    if (!confirmed) {
        return;
    }

    matches.splice(index, 1);
    refreshDashboard();
}

addMatchButton.addEventListener("click", openAddMatchModal);

closeModalButton.addEventListener("click", closeMatchModal);

matchModal.addEventListener("click", function(event) {
    if (event.target === matchModal) {
        closeMatchModal();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && !matchModal.hidden) {
        closeMatchModal();
    }
});

historyContainer.addEventListener("click", function(event) {
    const editButton = event.target.closest(".edit-match");
    const deleteButton = event.target.closest(".delete-match");

    if (editButton) {
        editMatch(Number(editButton.dataset.index));
    }

    if (deleteButton) {
        deleteMatch(Number(deleteButton.dataset.index));
    }
});

matchForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData(matchForm);

    const match = {
        opponent: formData.get("opponent").trim(),
        date: formData.get("date"),
        position: formData.get("position"),
        minutes: Number(formData.get("minutes")),
        goals: Number(formData.get("goals")),
        assists: Number(formData.get("assists")),
        shots: Number(formData.get("shots")),
        shotsOnTarget: Number(formData.get("shotsOnTarget")),
        passesAttempted: Number(formData.get("passesAttempted")),
        passesCompleted: Number(formData.get("passesCompleted")),
        keyPasses: Number(formData.get("keyPasses")),
        tackles: Number(formData.get("tackles")),
        interceptions: Number(formData.get("interceptions")),
        dribbles: Number(formData.get("dribbles"))
    };

    const numberFields = [
        match.minutes,
        match.goals,
        match.assists,
        match.shots,
        match.shotsOnTarget,
        match.passesAttempted,
        match.passesCompleted,
        match.keyPasses,
        match.tackles,
        match.interceptions,
        match.dribbles
    ];

    if (numberFields.some(value => !Number.isInteger(value) || value < 0)) {
        alert("Please enter valid non-negative whole numbers.");
        return;
    }

    if (match.shotsOnTarget > match.shots) {
        alert("Shots on target cannot exceed total shots.");
        return;
    }

    if (match.passesCompleted > match.passesAttempted) {
        alert("Completed passes cannot exceed attempted passes.");
        return;
    }

    const wasEditing = editingMatchIndex !== null;

    if (wasEditing) {
        matches[editingMatchIndex] = match;
    } else {
        matches.push(match);
    }

    refreshDashboard();
    closeMatchModal();

    alert(wasEditing
        ? "Match updated successfully!"
        : "Match saved successfully!");
});

const analyzeButton = document.getElementById("analyze-button");
const aiAnalysis = document.getElementById("ai-analysis");
const aiStatus = document.getElementById("ai-status");
const aiResult = document.getElementById("ai-result");

analyzeButton.addEventListener("click", async function() {
    if (matches.length === 0) {
        alert("Please add at least one match before requesting an analysis.");
        return;
    }

    aiAnalysis.hidden = false;
    aiStatus.textContent = "Analyzing your matches... This may take a little while.";
    aiResult.replaceChildren();
    analyzeButton.disabled = true;

    try {
        const response = await fetch("http://localhost:3000/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                matches: matches
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to generate analysis.");
        }

        aiStatus.textContent = "Analysis complete";

        const lines = data.analysis.split("\n");
        let currentList = null;

        lines.forEach(function(line) {
            const trimmedLine = line.trim();

            if (!trimmedLine) {
                currentList = null;
                return;
            }

            if (trimmedLine.startsWith("### ") || trimmedLine.startsWith("## ") || trimmedLine.startsWith("**")) {
                currentList = null;

                const heading = document.createElement("h3");
                heading.textContent = trimmedLine.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "");
                aiResult.appendChild(heading);

            } else if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
                if (!currentList) {
                    currentList = document.createElement("ul");
                    aiResult.appendChild(currentList);
                }

                const item = document.createElement("li");
                item.textContent = trimmedLine.substring(2).replace(/\*\*/g, "");
                currentList.appendChild(item);

            } else {
                currentList = null;

                const paragraph = document.createElement("p");
                paragraph.textContent = trimmedLine.replace(/\*\*/g, "");
                aiResult.appendChild(paragraph);
            }
        });

    } catch (error) {
        aiStatus.textContent = "Analysis unavailable";
        aiResult.textContent = error.message;
    } finally {
        analyzeButton.disabled = false;
    }
});

updateDashboard();
updatePerformanceOverview();
updatePerformanceInsights();
renderMatchHistory();
updatePerformanceChart();
updateContributionsChart();