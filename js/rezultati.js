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

    // 1. Iscrtavanje 8values traka
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


    // 2. Mapiranje stranaka
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

    let topParties = matches.slice(0, 3);
    
    topParties.forEach(m => {
        // Generisanje Reality Checka
        let realityHtml = '';
        let count = 0;
        for (const [zakonId, zakonData] of Object.entries(realityData)) {
            if (zakonData.glasovi[m.short] && count < 3) {
                realityHtml += `<div class="rc-item">
                                    <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${zakonData.datum} | ${zakonData.sjednica}</div>
                                    <strong style="color:#1e293b;">${zakonData.tema}</strong><br>
                                    <div style="margin-top:5px;">Glas stranke: <span class="vote-${zakonData.glasovi[m.short]}">${zakonData.glasovi[m.short]}</span></div>
                                </div>`;
                count++;
            }
        }

        resultsDiv.innerHTML += `
            <div class="party-card" style="border-left: 8px solid ${m.color}">
                <h2>${m.name} <span style="float:right; color:${m.color};">${m.match}%</span></h2>
                <p class="party-desc"><i>${m.stance_summary}</i></p>
                <details>
                    <summary>🗳️ Zvanična glasanja stranke (Reality Check)</summary>
                    <div class="details-content">${realityHtml || 'Nema izvještaja.'}</div>
                </details>
            </div>
        `;

        // Generisanje Političara
        if (m.zastupnici && m.zastupnici.length > 0) {
            let zastupnik = m.zastupnici[0]; 
            individualsDiv.innerHTML += `
                <div class="politician-card" style="border-left: 8px solid ${m.color}">
                    <h3 style="margin:0 0 5px 0; font-size:22px;">👤 ${zastupnik.ime}</h3>
                    <p style="margin:0; font-size:15px; color:#64748b;">Zastupnik stranke <b>${m.name}</b> (${m.match}% Vašeg poklapanja)</p>
                    <a href="${zastupnik.link}" target="_blank" class="pol-link">Provjeri glasački karton na Gianni Ravioli ↗</a>
                </div>
            `;
        }
    });

    iscrtajKompas(userPos, matches);
}

// 3. Iscrtavanje poboljšanog 2D Kompasa (Ekonomija X, Društvo Y)
// Ovu funkciju zamijeni na dnu rezultati.js fajla
function iscrtajKompas(userPos, matches) {
    const ctx = document.getElementById('compassChart').getContext('2d');
    const mapToAxis = (val) => ((val - 50) / 5); 
    
    let datasets = [{
        label: ' Vaša pozicija',
        data: [{ x: mapToAxis(userPos.econ), y: mapToAxis(userPos.society) * -1 }],
        backgroundColor: '#0C2340',
        borderColor: '#ffffff',
        borderWidth: 2,
        pointRadius: 12,
        pointStyle: 'rectRot' // Vaša pozicija ostaje istaknuti romb
    }];

    // Dodajemo stranke na graf uz pokušaj učitavanja slike
    matches.slice(0, 8).forEach(m => {
        let pointStyle = 'circle';
        let img = new Image();
        img.src = `img/${m.short}.png`; // Ovdje traži sliku npr. img/SDA.png
        
        // Ako se slika učita, koristi nju umjesto kružića
        img.onload = function() {
            let meta = chartInstance.getDatasetMeta(datasets.findIndex(d => d.label === ' ' + m.short));
            if(meta) meta.data[0].options.pointStyle = img;
            chartInstance.update();
        };

        datasets.push({
            label: ' ' + m.short,
            data: [{ x: mapToAxis(m.scores.econ), y: mapToAxis(m.scores.society) * -1 }],
            backgroundColor: m.color,
            pointRadius: 10,
            pointStyle: img // Pokušava postaviti sliku odmah
        });
    });

    const chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            aspectRatio: 1, 
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ctx.dataset.label
                    }
                }
            },
            scales: {
                x: { 
                    min: -10, max: 10, 
                    title: { display: true, text: '⬅ Ekonomija (Država vs Tržište) ➡', font: { weight: 'bold' } },
                    grid: { color: (ctx) => ctx.tick.value === 0 ? '#000000' : '#e2e8f0', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 }
                },
                y: { 
                    min: -10, max: 10, 
                    title: { display: true, text: '⬅ Društvo (Tradicionalno vs Progresivno) ➡', font: { weight: 'bold' } },
                    grid: { color: (ctx) => ctx.tick.value === 0 ? '#000000' : '#e2e8f0', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 }
                }
            }
        }
    });
}
