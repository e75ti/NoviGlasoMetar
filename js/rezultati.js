document.addEventListener("DOMContentLoaded", () => {
    const userAnswersStr = localStorage.getItem('userAnswers');
    if (!userAnswersStr) {
        document.getElementById('capture-area').innerHTML = "<h3 style='color:red; text-align:center;'>Nema odgovora! Riješite <a href='kviz.html'>kviz</a>.</h3>";
        return;
    }

    const userAnswers = JSON.parse(userAnswersStr);

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
        document.getElementById('capture-area').innerHTML = `<h3 style='color:red;'>Greška pri učitavanju podataka.</h3><p>${err.message}</p>`;
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

    // 1. ISCRTAVANJE 8VALUES TRAKA
    const axesContainer = document.getElementById('axes-container');
    const renderBar = (title, leftLabel, rightLabel, leftClass, rightClass, val) => {
        const leftPercent = 100 - val;
        const rightPercent = val;
        return `
            <div class="axis">
                <div class="axis-title">${title}</div>
                <div class="bar-container">
                    <div class="${leftClass} bar-left" style="width: ${leftPercent}%">${leftPercent > 10 ? leftPercent + '%' : ''}</div>
                    <div class="${rightClass} bar-right" style="width: ${rightPercent}%">${rightPercent > 10 ? rightPercent + '%' : ''}</div>
                </div>
                <div class="axis-labels">
                    <span>${leftLabel}</span>
                    <span>${rightLabel}</span>
                </div>
            </div>
        `;
    };

    axesContainer.innerHTML = 
        renderBar("Ekonomija", "Državni Intervencionizam", "Slobodno Tržište", "econ-left", "econ-right", userPos.econ) +
        renderBar("Ustrojstvo Države", "Građansko / Centralizovano", "Etničko / Decentralizovano", "state-left", "state-right", userPos.state) +
        renderBar("Društvo i Kultura", "Progresivno / Sekularno", "Tradicionalno / Konzervativno", "soc-left", "soc-right", userPos.society) +
        renderBar("Geopolitika", "Euro-atlantizam (Zapad)", "Suverenizam (Istok / Neutralnost)", "for-left", "for-right", userPos.foreign);


    // 2. IZRACUNAVANJE STRANAKA
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
    const individualsDiv = document.getElementById('individuals-list');
    resultsDiv.innerHTML = ""; 
    
    let individualsHtml = '<div class="politician-list">';
    let topParties = matches.slice(0, 3);
    
    topParties.forEach(m => {
        let realityHtml = '';
        let count = 0;
        for (const [zakonId, zakonData] of Object.entries(realityData)) {
            if (zakonData.glasovi[m.short] && count < 2) {
                let bojaGlasa = zakonData.glasovi[m.short] === "ZA" ? "green" : (zakonData.glasovi[m.short] === "PROTIV" ? "red" : "gray");
                realityHtml += `<div class="rc-item">
                                    <strong>Akt:</strong> ${zakonData.tema}<br>
                                    <strong>Stav stranke:</strong> <span style="color:${bojaGlasa}; font-weight:bold;">${zakonData.glasovi[m.short]}</span>
                                </div>`;
                count++;
            }
        }

        resultsDiv.innerHTML += `
            <div class="party-card" style="border-left: 5px solid ${m.color}">
                <h2>${m.name} (${m.match}%)</h2>
                <p><i>${m.stance_summary}</i></p>
                <details>
                    <summary>🗳️ Zvanična glasanja stranke (Fact Check)</summary>
                    <div class="details-content">${realityHtml || 'Nema izvještaja.'}</div>
                </details>
            </div>
        `;

        // 3. PRIKAZ "SPIRITUALNIH" POLITIČARA (Lijepe kartice!)
        if (m.zastupnici && m.zastupnici.length > 0) {
            let zastupnik = m.zastupnici[0]; 
            individualsHtml += `
                <div class="pol-card" style="border-color: ${m.color};">
                    <div class="pol-info">
                        <h3>👤 ${zastupnik.ime}</h3>
                        <p>Član stranke: <b>${m.short}</b> (${m.match}% poklapanja)</p>
                    </div>
                    <a href="${zastupnik.link}" target="_blank" class="pol-btn">Glasački karton ↗</a>
                </div>
            `;
        }
    });

    individualsHtml += '</div>';
    individualsDiv.innerHTML = individualsHtml === '<div class="politician-list"></div>' ? '<p>Nema dostupnih zastupnika za vaš rezultat.</p>' : individualsHtml;

    iscrtajKompas(userPos, matches);
}

// 4. CHART.JS KOMPAS (POPRAVLJENI KRUGOVI)
function iscrtajKompas(userPos, matches) {
    const ctx = document.getElementById('compassChart').getContext('2d');
    const mapToAxis = (val) => ((val - 50) / 5); 
    
    let datasets = [{
        label: ' Vaša pozicija',
        // Uklonjeno * -1: Sada progresivno ide u minus (dolje), tradicionalno u plus (gore)
        data: [{ x: mapToAxis(userPos.econ), y: mapToAxis(userPos.society) }],
        backgroundColor: '#000000',
        borderColor: '#ffffff',
        borderWidth: 2,
        pointRadius: 10,
        pointStyle: 'rectRot'
    }];

    let chartInstance;

    matches.slice(0, 8).forEach(m => {
        let dataset = {
            label: ' ' + m.short,
            // Uklonjeno * -1
            data: [{ x: mapToAxis(m.scores.econ), y: mapToAxis(m.scores.society) }],
            backgroundColor: m.color,
            pointRadius: 8,
            pointStyle: 'circle'
        };
        datasets.push(dataset);

        let img = new Image();
        img.src = `img/${m.short}.png`; 
        
        img.onload = function() {
            dataset.pointStyle = img;
            if(chartInstance) chartInstance.update();
        };
    });

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            aspectRatio: 1, 
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                tooltip: { callbacks: { label: (ctx) => ctx.dataset.label } }
            },
            scales: {
                x: { 
                    min: -10, max: 10, 
                    title: { display: true, text: '⬅ Ljevica (Država) | Desnica (Tržište) ➡', font: { weight: 'bold' } },
                    grid: { color: (ctx) => ctx.tick.value === 0 ? '#000000' : '#e2e8f0', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 }
                },
                y: { 
                    min: -10, max: 10, 
                    // Obrnuti nazivi da odgovaraju vrijednostima (-10 do +10)
                    title: { display: true, text: '⬅ Progresivno (Slobodarsko) | Tradicionalno (Autoritarno) ➡', font: { weight: 'bold' } },
                    grid: { color: (ctx) => ctx.tick.value === 0 ? '#000000' : '#e2e8f0', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 }
                }
            }
        }
    });
}
