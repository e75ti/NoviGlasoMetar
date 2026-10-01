let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; 

fetch('data/questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        loadQuestion();
    });

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
        window.location.href = 'rezultati.html';
        return;
    }
    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.question;
    
    const progressPercent = (currentQuestionIndex / questions.length) * 100;
    document.getElementById('progress-bar').style.width = progressPercent + '%';
    document.getElementById('progress-text').innerText = `Pitanje ${currentQuestionIndex + 1} od ${questions.length}`;
}

function answer(weight) {
    const q = questions[currentQuestionIndex];
    userAnswers[q.id] = { weight: weight, effect: q.effect }; // Spremamo i efekte za brzo računanje u rezultatima
    currentQuestionIndex++;
    loadQuestion();
}
