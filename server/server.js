const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

async function askAI(messages, maxTokens) {
    const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama3.1:8b",
            stream: false,
            messages: messages,
            options: {
                temperature: 0.3,
                num_predict: maxTokens
            }
        })
    });

    if (!response.ok) {
        throw new Error("Ollama could not generate an analysis.");
    }

    const data = await response.json();

    return data.message.content;
}

function extractSections(comparison) {
    const headings = [
        "Overall Summary",
        "Attacking",
        "Passing",
        "Defending",
        "Areas to Improve"
    ];

    const sections = {};
    const headingPattern = /^###\s+(.+)$/gm;
    const matches = [...comparison.matchAll(headingPattern)];

    matches.forEach((headingMatch, index) => {
        const heading = headingMatch[1].trim();
        const sectionStart = headingMatch.index + headingMatch[0].length;
        const sectionEnd = index + 1 < matches.length
            ? matches[index + 1].index
            : comparison.length;

        const content = comparison
            .slice(sectionStart, sectionEnd)
            .trim();

        const matchingHeading = headings.find(function(item) {
            return item.toLowerCase() === heading.toLowerCase();
        });

        if (matchingHeading) {
            sections[matchingHeading] = content;
        }
    });

    headings.forEach(function(heading) {
        if (!sections[heading]) {
            sections[heading] = "This section could not be generated. Please try analyzing again.";
        }
    });

    return sections;
}

app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        message: "SoccerIQ backend is running!"
    });
});

app.post("/api/analyze", async (req, res) => {
    try {
        const matches = req.body.matches;

        if (!Array.isArray(matches) || matches.length === 0) {
            return res.status(400).json({
                error: "No match statistics were provided."
            });
        }

        const individualReports = [];

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];

            const passesAttempted = Number(match.passesAttempted) || 0;
            const passesCompleted = Number(match.passesCompleted) || 0;
            const shots = Number(match.shots) || 0;
            const shotsOnTarget = Number(match.shotsOnTarget) || 0;
            const goals = Number(match.goals) || 0;

            const calculatedStats = {
                ...match,
                passingAccuracy: passesAttempted > 0
                    ? Number(((passesCompleted / passesAttempted) * 100).toFixed(1))
                    : null,
                shotAccuracy: shots > 0
                    ? Number(((shotsOnTarget / shots) * 100).toFixed(1))
                    : null,
                goalConversion: shots > 0
                    ? Number(((goals / shots) * 100).toFixed(1))
                    : null
            };

            const report = await askAI([
                {
                    role: "system",
                    content: `You are SoccerIQ, an expert soccer performance analyst.

Analyze ONE soccer match at a time.

Use only the statistics and information explicitly provided. Never invent, change, or assume statistics or events.

Important accuracy rules:
- Never invent a final score, team result, victory, defeat, or draw.
- Never assume how many goals the opposing team scored.
- Never invent match events, opponent quality, or team tactics.
- Do not claim the player contributed to a victory or defeat unless the result is explicitly provided.
- Do not describe a statistic as unusually high or low without a reliable comparison.
- Do not assume that a high number of actions automatically means a good performance.
- Distinguish between what the statistics demonstrate and what they might suggest.
- Consider the player's position and minutes played.
- If the available statistics do not support a conclusion, say so.

Write a detailed individual match report with these sections:

### Performance Overview
Explain the player's overall statistical contribution in this match.

### Key Strengths
Identify 2-3 meaningful strengths. Connect each observation to specific statistics and explain what they suggest about the player's performance.

### Areas to Improve
Identify 1-2 potential development areas supported by the statistics. Give practical advice without making unsupported assumptions.

### Tactical Observations
Connect the statistics to the player's position and possible role in the team. Do not invent match events or claim to know the team's tactics.

Be specific, constructive, and insightful. Do not discuss other matches.`
                },
                {
                    role: "user",
                    content: `Analyze this match only.

Match ${i + 1} of ${matches.length}

${JSON.stringify(calculatedStats, null, 2)}

The statistics passingAccuracy, shotAccuracy, and goalConversion have been calculated by the backend. Use these exact values. Do not recalculate them.

Passing accuracy measures completed passes divided by attempted passes.
Shot accuracy measures shots on target divided by total shots.
Goal conversion measures goals divided by total shots.

These are three different measurements. Never confuse them.

A null value means the statistic cannot be calculated because there were no attempts.

Keep every statistic associated with this match. Do not combine it with other games.`
                }
            ], 700);

            individualReports.push({
                match: match,
                report: report
            });
        }

        const comparison = await askAI([
            {
                role: "system",
                content: `You are SoccerIQ, an expert soccer performance analyst.

Analyze the player's overall development across multiple matches.

Use only the supplied statistics and individual reports. Never invent, change, or assume statistics or events.

Important accuracy rules:
- Never invent match scores, victories, defeats, draws, or team results.
- Never invent match events, opponent quality, or team tactics.
- Do not claim improvement or decline unless the match data supports it.
- Do not describe a statistic as unusually high or low without a reliable comparison.
- Account for differences in position and minutes played when comparing performances.
- Distinguish between demonstrated patterns and possible explanations.
- Do not repeat individual match reports unnecessarily.
- If there is not enough evidence to make a conclusion, explain that limitation.
- Do not suggest tracking additional statistics.
- Do not place information in a category unless the supplied data supports it.
- Do not invent statistics that were not recorded.
- If a category has insufficient evidence, clearly say so.

Write exactly these five sections, using the exact headings shown:

### Overall Summary
Give a concise overview of the player's overall performance and recurring playing style across the available matches. Focus on the most meaningful patterns.

### Attacking
Analyze goals, assists, shots, shots on target, shot accuracy, goal conversion, key passes, and dribbles when those statistics are available. Explain what the statistics demonstrate and what they might suggest about attacking contribution.

### Passing
Analyze passes attempted, passes completed, and passing accuracy. Discuss passing consistency and patterns across matches when the data supports it.

### Defending
Analyze tackles and interceptions. Discuss defensive contribution and patterns across matches when the data supports it.

### Areas to Improve
Identify the most important development opportunities supported by the statistics. Give specific, practical training recommendations and drills. Connect each recommendation to the evidence.

Be detailed, constructive, and specific. Avoid generic advice and repeated information.`
            },
            {
                role: "user",
                content: `Analyze the player's overall performance using the following match statistics and individual reports.

${JSON.stringify(individualReports, null, 2)}

The calculated statistics are:
- passingAccuracy: completed passes divided by attempted passes.
- shotAccuracy: shots on target divided by total shots.
- goalConversion: goals divided by total shots.

Use the calculated values exactly as provided. Never confuse these three measurements or calculate them differently.

Compare matches using their actual statistics. Pay attention to differences in position and minutes played.

Do not compare statistics that measure different things. Do not claim improvement or decline unless the data supports it.

Identify meaningful patterns rather than simply listing numbers. Avoid repeating the individual match reports.

Focus on:
- The player's overall playing style.
- Attacking contribution.
- Passing performance.
- Defensive contribution.
- Areas that repeatedly need improvement.
- Differences between performances in different positions.
- A personalized training plan based on the actual statistical evidence.

Do not invent match events, scores, results, or tactical instructions. If the available data does not support a conclusion, acknowledge that limitation.

Do not suggest additional statistics to track.

Use all five exact headings requested in your instructions. Do not add, remove, rename, or combine sections.`
            }
        ], 1300);

        const formattedReports = individualReports.map((item, index) => {
            const match = item.match;

            return `### Match ${index + 1}: ${match.opponent} — ${match.date} — ${match.position}\n\n${item.report}`;
        });

        const analysis = [
            "## Individual Match Reports",
            ...formattedReports,
            "## Overall Analysis",
            comparison
        ].join("\n\n");

        const sections = extractSections(comparison);

        res.json({
            analysis: analysis,
            sections: {
                summary: sections["Overall Summary"],
                attacking: sections["Attacking"],
                passing: sections["Passing"],
                defending: sections["Defending"],
                improvements: sections["Areas to Improve"],
                fullAnalysis: analysis
            }
        });

    } catch (error) {
        console.error("AI analysis error:", error.message);

        res.status(500).json({
            error: "Unable to generate an analysis. Please try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`SoccerIQ server running at http://localhost:${PORT}`);
});