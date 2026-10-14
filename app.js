document.addEventListener('DOMContentLoaded', () => {
    let userProgress = JSON.parse(localStorage.getItem('algebraProgress')) || {};
    let totalSolved = 0;
    
    function calculateTotalSolved() {
        totalSolved = 0;
        for (let topicId in userProgress) {
            for (let exerciseId in userProgress[topicId]) {
                if (userProgress[topicId][exerciseId] === true) {
                    totalSolved++;
                }
            }
        }
        document.getElementById('total-solved').innerText = totalSolved;
    }

    function saveProgress() {
        localStorage.setItem('algebraProgress', JSON.stringify(userProgress));
        calculateTotalSolved();
    }
    
    function renderMath() {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });
    }

    const mainContent = document.getElementById('main-content');
    const headerTitle = document.querySelector('header h1');

    headerTitle.addEventListener('click', renderTopicList);

    const topicMeta = {
        negative_numbers:          { icon: '➖', color: 'blue' },
        column_mul_div:            { icon: '✖️', color: 'orange' },
        common_fractions:          { icon: '½', color: 'green' },
        fractions_mul_div:         { icon: '➗', color: 'purple' },
        fraction_to_decimal:       { icon: '🔄', color: 'teal' },
        decimal_fractions:         { icon: '🔢', color: 'red' },
        brackets_transformations:  { icon: '🔓', color: 'indigo' },
        powers:                    { icon: '📈', color: 'amber' },
        polynomials:               { icon: '📐', color: 'pink' },
        fsu:                       { icon: '🧩', color: 'blue' },
        algebraic_fractions:       { icon: '🧮', color: 'orange' },
        roots:                     { icon: '√', color: 'green' },
        literal_expressions:       { icon: '🔤', color: 'purple' },
        inequalities_modulus:      { icon: '📊', color: 'teal' },
        proportions_percents:      { icon: '💯', color: 'red' },
        equations:                 { icon: '⚖️', color: 'indigo' },
        systems_of_equations:      { icon: '🔗', color: 'amber' },
        inequalities_systems:      { icon: '↔️', color: 'pink' },
    };

    function getMotivation(total) {
        if (total === 0) return '🚀 Начни решать — первый шаг самый важный!';
        if (total < 10) return `🔥 Уже ${total}! Отличный старт!`;
        if (total < 30) return `💪 ${total} задач решено — так держать!`;
        if (total < 60) return `🌟 Ого, ${total} задач! Ты на верном пути!`;
        if (total < 100) return `🏆 ${total} задач! Ты настоящий математик!`;
        return `👑 ${total} задач! Легенда алгебры!`;
    }

    function createProgressRing(solved, total) {
        const percent = total > 0 ? (solved / total) * 100 : 0;
        const radius = 20;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        if (percent >= 100) {
            const badge = document.createElement('div');
            badge.className = 'complete-badge';
            badge.innerHTML = '✅';
            return badge;
        }

        const container = document.createElement('div');
        container.className = 'progress-ring-container';
        container.innerHTML = `
            <svg class="progress-ring" viewBox="0 0 48 48">
                <circle class="progress-ring-bg" cx="24" cy="24" r="${radius}" />
                <circle class="progress-ring-fill" cx="24" cy="24" r="${radius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}" />
            </svg>
            <span class="progress-ring-text">${solved}/${total}</span>
        `;
        return container;
    }

    function renderTopicList() {
        calculateTotalSolved();
        mainContent.innerHTML = '';

        // Motivational banner
        let totalExercises = 0;
        topicsData.forEach(t => totalExercises += t.exercises.length);
        const overallPercent = totalExercises > 0 ? (totalSolved / totalExercises) * 100 : 0;

        const banner = document.createElement('div');
        banner.className = 'motivation-banner';
        banner.innerHTML = `
            <div class="banner-text">${getMotivation(totalSolved)}</div>
            <div class="banner-progress-track">
                <div class="banner-progress-fill" style="width: ${overallPercent}%"></div>
            </div>
        `;
        mainContent.appendChild(banner);

        const ul = document.createElement('ul');
        ul.className = 'topic-list';

        topicsData.forEach(topic => {
            const meta = topicMeta[topic.id] || { icon: '📝', color: 'blue' };
            const solvedInTopic = userProgress[topic.id] ? Object.keys(userProgress[topic.id]).filter(k => userProgress[topic.id][k]).length : 0;
            const totalInTopic = topic.exercises.length;

            const li = document.createElement('li');
            li.className = 'topic-item';
            li.setAttribute('data-color', meta.color);

            // Icon
            const iconDiv = document.createElement('div');
            iconDiv.className = 'topic-icon';
            iconDiv.textContent = meta.icon;
            li.appendChild(iconDiv);

            // Text content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'topic-item-content';
            contentDiv.innerHTML = `
                <h3>${topic.title}</h3>
                <span class="topic-progress-text">${solvedInTopic} из ${totalInTopic} решено</span>
            `;
            li.appendChild(contentDiv);

            // Progress ring or complete badge
            li.appendChild(createProgressRing(solvedInTopic, totalInTopic));

            li.addEventListener('click', () => renderTopic(topic));
            ul.appendChild(li);
        });

        mainContent.appendChild(ul);
        window.scrollTo(0, 0);
    }

    function renderTopic(topic) {
        window.scrollTo(0, 0);
        mainContent.innerHTML = '';

        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '← Назад к темам';
        backBtn.onclick = renderTopicList;
        mainContent.appendChild(backBtn);

        const theoryDiv = document.createElement('div');
        theoryDiv.className = 'theory-section';
        theoryDiv.innerHTML = `<h2>📚 Теория</h2>${topic.theory}`;
        mainContent.appendChild(theoryDiv);

        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'example-section';
        exampleDiv.innerHTML = `<h2>💡 Примеры решений</h2>${topic.example}`;
        mainContent.appendChild(exampleDiv);

        const exercisesDiv = document.createElement('div');
        exercisesDiv.className = 'exercises-section';
        exercisesDiv.innerHTML = `<h2>🎯 Практика (заданий: ${topic.exercises.length})</h2>`;

        if (!userProgress[topic.id]) {
            userProgress[topic.id] = {};
        }

        topic.exercises.forEach((ex, index) => {
            const isSolved = userProgress[topic.id][index] === true;
            const expectsFraction = ex.answer.includes('/');
            
            const exDiv = document.createElement('div');
            exDiv.className = 'exercise';
            if (isSolved) exDiv.classList.add('solved');
            
            const qDiv = document.createElement('div');
            qDiv.className = 'question';
            qDiv.innerHTML = `<span>${index + 1})&nbsp;</span> ${ex.question} &nbsp;=`;
            exDiv.appendChild(qDiv);

            const answerRow = document.createElement('div');
            answerRow.className = 'answer-row';
            
            let inputElements = {};
            const hasLetters = /[a-zA-Zа-яА-Я]/.test(ex.answer);

            if (expectsFraction) {
                const fracInputDiv = document.createElement('div');
                fracInputDiv.className = 'frac-input';
                
                const numInput = document.createElement('input');
                numInput.className = 'answer-input num-input';
                numInput.type = 'text';
                if (!hasLetters) numInput.inputMode = 'numeric';
                
                const fracLine = document.createElement('div');
                fracLine.className = 'frac-input-line';

                const denInput = document.createElement('input');
                denInput.className = 'answer-input den-input';
                denInput.type = 'text';
                if (!hasLetters) denInput.inputMode = 'numeric';

                if (isSolved) {
                    const parts = ex.answer.split('/');
                    numInput.value = parts[0];
                    denInput.value = parts[1];
                    numInput.disabled = true;
                    denInput.disabled = true;
                }

                fracInputDiv.appendChild(numInput);
                fracInputDiv.appendChild(fracLine);
                fracInputDiv.appendChild(denInput);
                
                answerRow.appendChild(fracInputDiv);
                
                inputElements.num = numInput;
                inputElements.den = denInput;
            } else {
                const input = document.createElement('input');
                input.className = 'answer-input single-input';
                input.type = 'text';
                if (!hasLetters) input.inputMode = 'decimal';
                input.placeholder = 'Ответ...';
                if (isSolved) {
                    input.value = ex.answer;
                    input.disabled = true;
                }
                answerRow.appendChild(input);
                inputElements.single = input;
            }

            const checkBtn = document.createElement('button');
            checkBtn.className = 'check-btn';
            checkBtn.innerText = 'Проверить';
            if (isSolved) {
                checkBtn.style.display = 'none';
            }
            answerRow.appendChild(checkBtn);
            exDiv.appendChild(answerRow);

            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback';
            if (isSolved) {
                feedbackDiv.innerText = 'Супер! Верно! 🌟';
                feedbackDiv.className = 'feedback correct';
            }
            exDiv.appendChild(feedbackDiv);

            const solutionBtn = document.createElement('button');
            solutionBtn.className = 'show-solution-btn';
            solutionBtn.innerText = 'Показать решение';
            solutionBtn.style.display = 'none';
            exDiv.appendChild(solutionBtn);

            const solutionDiv = document.createElement('div');
            solutionDiv.className = 'solution';
            solutionDiv.innerHTML = `<strong>Решение:</strong> ${ex.solution}`;
            exDiv.appendChild(solutionDiv);

            const triggerCheck = () => {
                let userAns = '';
                if (expectsFraction) {
                    const n = inputElements.num.value.trim();
                    const d = inputElements.den.value.trim();
                    if (!n || !d) {
                        feedbackDiv.innerText = 'Введите числитель и знаменатель.';
                        feedbackDiv.className = 'feedback incorrect';
                        return;
                    }
                    userAns = `${n}/${d}`;
                } else {
                    userAns = inputElements.single.value.trim().replace(',', '.').replace(/\s+/g, '');
                }

                let correctAns = ex.answer.replace(',', '.').replace(/\s+/g, '');

                if (userAns === correctAns) {
                    feedbackDiv.innerText = 'Супер! Верно! 🌟';
                    feedbackDiv.className = 'feedback correct';
                    exDiv.classList.add('solved');

                    // Анимация звездочки
                    const star = document.createElement('div');
                    star.className = 'star-animation';
                    star.innerText = '⭐';
                    exDiv.appendChild(star);

                    if (expectsFraction) {
                        inputElements.num.disabled = true;
                        inputElements.den.disabled = true;
                    } else {
                        inputElements.single.disabled = true;
                    }
                    checkBtn.style.display = 'none';
                    solutionBtn.style.display = 'none';
                    userProgress[topic.id][index] = true;
                    saveProgress();
                } else {
                    feedbackDiv.innerText = 'Ой, неверно. Попробуй еще раз или посмотри решение.';
                    feedbackDiv.className = 'feedback incorrect';
                    solutionBtn.style.display = 'inline-block';
                }
            };

            checkBtn.addEventListener('click', triggerCheck);

            if (expectsFraction) {
                inputElements.num.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerCheck(); });
                inputElements.den.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerCheck(); });
            } else {
                inputElements.single.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerCheck(); });
            }

            solutionBtn.addEventListener('click', () => {
                solutionDiv.style.display = 'block';
                solutionBtn.style.display = 'none'; 
            });

            exercisesDiv.appendChild(exDiv);
        });

        mainContent.appendChild(exercisesDiv);
        renderMath();
    }

    renderTopicList();
});
