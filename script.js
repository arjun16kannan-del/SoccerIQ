const addMatchButton = document.querySelector(".welcome .add-match");
const matchModal = document.getElementById("match-modal");
const closeModalButton = document.getElementById("close-modal");
const matchForm = document.getElementById("match-form");

let matches = JSON.parse(localStorage.getItem("soccerIQMatches")) || [];
let performanceChart = null;
let contributionsChart = null;

function renderMatchHistory() {
    const historyContainer = document.getElementById("match-history");
    const historyCount = document.getElementById("history-count");
    const emptyHistory = document.getElementById("empty-history");

    historyContainer.replaceChildren();

    historyCount.textContent = matches.length + (matches.length === 1 ? " match" : " matches");

    emptyHistory.hidden = matches.length > 0;

    matches.slice().reverse().forEach(function(match) {
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

addMatchButton.addEventListener("click", function() {
    matchModal.hidden = false;
});

closeModalButton.addEventListener("click", function() {
    matchModal.hidden = true;
});

matchModal.addEventListener("click", function(event) {
    if (event.target === matchModal) {
        matchModal.hidden = true;
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        matchModal.hidden = true;
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

    matches.push(match);

    localStorage.setItem("soccerIQMatches", JSON.stringify(matches));

    updateDashboard();
    renderMatchHistory();
    updatePerformanceChart();
    updateContributionsChart();

    matchForm.reset();
    matchModal.hidden = true;

    alert("Match saved successfully!");
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
renderMatchHistory();
updatePerformanceChart();
updateContributionsChart();