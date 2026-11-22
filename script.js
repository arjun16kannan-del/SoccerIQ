const addMatchButton = document.querySelector(".welcome .add-match");
const matchModal = document.getElementById("match-modal");
const closeModalButton = document.getElementById("close-modal");
const matchForm = document.getElementById("match-form");

let matches = JSON.parse(localStorage.getItem("soccerIQMatches")) || [];

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

    matchForm.reset();
    matchModal.hidden = true;

    alert("Match saved successfully!");
});

updateDashboard();
renderMatchHistory();