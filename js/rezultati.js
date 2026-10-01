document.addEventListener("DOMContentLoaded", () => {
    const resultsDiv = document.getElementById('results-list');
    const userAnswersStr = localStorage.getItem('userAnswers');

    if (!userAnswersStr) {
        resultsDiv.innerHTML = "<h3 style='color:red;'>Nema odgovora! Riješite <a href='kviz.html'>kviz</a>.</h3>";
        return;
    }

    const userAnswers = JSON.parse(userAnswersStr);

    // Sada učitavamo samo 2 fajla! Zastupnici su već unutar parties.json
    Promise.all([
        fetch('data/parties.json').then(res => res.json()),
        fetch('data/reality_full.json').then(res => res.json())
    ])
    .then(([partiesData, reality]) => {
        const realityData = reality.parlameter_votes || {};
        izracunajPrikaziRezultate(userAnswers, partiesData, realityData);
    })
    .catch(err => {
        console.error(err);
        resultsDiv.innerHTML = `<h3 style='color:red;'>Greška pri učitavanju podataka.</h3><p>${err.message}</p>`;
    });
});

function izracunajPrikaziRezultate(userAnswers, partiesData, realityData) {
    let rawScores = { econ: 0, state: 0, society: 0, foreign: 0 };
    let maxScores = { econ: 0, state: 0, society: 0, foreign: 0 };

    Object.values(userAnswers).forEach(ans => {
        if(ans && ans.effect) {
            for (const [axis, val] of Object.entries(ans.effect)) {
                rawScores[axis] += ans.weight * val;
                maxScores[axis] += Math.abs(val);
            }
        }
    });

    let userPos = {};
    ['econ', 'state', 'society', 'foreign'].forEach(axis => {
        userPos[axis] = maxScores[axis] === 0 ? 50 : Math.round(((rawScores[axis] + maxScores[axis]) / (2 * maxScores[axis])) * 100);
    });

    let matches = [];
    for (const [partyId, party] of Object.entries(partiesData)) {
        let diff = 0;
        ['econ', 'state', 'society', 'foreign'].forEach(axis => {
            diff += Math.abs(userPos[axis] - party.scores[axis]);
        });
        let matchPercent = Math.round((1 - (diff / 400)) * 100);
        matches.push({ id: partyId, ...party, match: matchPercent });
    }
    matches.sort((a, b) => b.match - a.match);

    const resultsDiv = document.getElementById('results-list');
    resultsDiv.innerHTML = ""; 

    matches.forEach(m => {
        // Zastupnike sada čitamo direktno iz stranke (m.zastupnici)
        let zastupniciHtml = '';
        if (m.zastupnici && m.zastupnici.length > 0) {
            zastupniciHtml = m.zastupnici.map(z => 
                `<li><a href="${z.link}" target="_blank">${z.ime} (Provjeri glasanja)</a></li>`
            ).join('');
        }

        let realityHtml = '';
        let count = 0;
        for (const [zakonId, zakonData] of Object.entries(realityData)) {
            if (zakonData.glasovi[m.short] && count < 3) {
                let bojaGlasa = zakonData.glasovi[m.short] === "ZA" ? "green" : (zakonData.glasovi[m.short] === "PROTIV" ? "red" : "gray");
                realityHtml += `<div class="rc-item">
                                    <strong>Akt:</strong> ${zakonData.tema}<br>
                                    <strong>Glasali:</strong> <span style="color:${bojaGlasa}; font-weight:bold;">${zakonData.glasovi[m.short]}</span>
                                </div>`;
                count++;
            }
        }

        resultsDiv.innerHTML += `
            <div class="party-card" style="border-left: 5px solid ${m.color}">
                <h2>${m.name} (${m.match}%)</h2>
                <p><i>${m.stance_summary}</i></p>
                
                <details>
                    <summary>🗳️ Provjera stvarnih glasanja (Reality Check)</summary>
                    <div class="details-content">${realityHtml || 'Trenutno nema dostupnih izvještaja sa sjednica.'}</div>
                </details>

                <details>
                    <summary>👤 Pojedinačni zastupnici</summary>
                    <div class="details-content">
                        <p class="disclaimer">Kliknite na imena ispod kako biste na nezavisnoj platformi 'Gianni Ravioli' vidjeli njihove stvarne glasačke kartone.</p>
                        <ul>${zastupniciHtml || 'Nema evidentiranih zastupnika.'}</ul>
                    </div>
                </details>
            </div>
        `;
    });

    iscrtajKompas(userPos, matches);
}

function iscrtajKompas(userPos, matches) {
    const ctx = document.getElementById('compassChart').getContext('2d');
    const mapToAxis = (val) => ((val - 50) / 5);
    
    let datasets = [{
        label: 'Vi',
        data: [{ x: mapToAxis(userPos.econ), y: mapToAxis(userPos.society) }],
        backgroundColor: '#000000',
        pointRadius: 10,
        pointStyle: 'rectRot'
    }];

    matches.slice(0, 5).forEach(m => {
        datasets.push({
            label: m.short,
            data: [{ x: mapToAxis(m.scores.econ), y: mapToAxis(m.scores.society) }],
            backgroundColor: m.color,
            pointRadius: 7
        });
    });

    new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            scales: {
                x: { min: -10, max: 10, title: { display: true, text: 'Ljevica (Država) ⟷ Desnica (Tržište)' } },
                y: { min: -10, max: 10, title: { display: true, text: 'Progresivno ⟷ Tradicionalno' } }
            }
        }
    });
}
