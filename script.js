
"use strict";

// ==================== DIFFICULTY LEVELS ====================

const levels = {
    easy: { name: "Easy", max: 50 },
    medium: { name: "Medium", max: 100 },
    hard: { name: "Hard", max: 500 },
    expert: { name: "Expert", max: 1000 }
};

// ==================== PERFORMANCE RATINGS ====================

const performanceTiers = {
    genius: {
        title: "🏆 GENIUS SHOT — High Five!",
        className: "genius",
        quotes: [
            "Are you a mind reader? Lucky number ला तुझी भीती वाटली बहुतेक! 😂",
            "इतक्या कमी attempts मध्ये? तुझ्या brain ला turbo mode आहे! 🚀",
            "Sherlock Holmes पण म्हणेल, boss मला training दे! 🕵️",
            "Perfect aim! आजचा दिवस तुझ्या नावावर! 🎯"
        ]
    },
    sharp: {
        title: "⚡ SHARP SHOOTER — Well Played!",
        className: "sharp",
        quotes: [
            "Detective mode ON! थोडा वेळ लागला, पण case solve झाला! 🕵️",
            "Smart work beats luck! आज तुझं brain जिंकलं! 🧠",
            "Lucky number लपलं होतं, पण तुझ्यापासून सुटलं नाही! 😂",
            "Nice shot! पुढच्या वेळी अजून कमी attempts मध्ये करून दाखव! 🎯"
        ]
    },
    comeback: {
        title: "🔥 COMEBACK CHAMPION — Never Give Up!",
        className: "comeback",
        quotes: [
            "Lucky number ने लपाछपी खेळली, पण तू हार मानली नाहीस! 😂",
            "जिंकायला वेळ लागला, पण hero ची entry झालीच! 😎",
            "Slow and steady wins the game! पुढच्या वेळी अजून भारी! 💪",
            "Attempts जास्त झाले? काही हरकत नाही, confidence कमी नको! 🚀"
        ]
    }
};

// ==================== GET HTML ELEMENTS ====================

const homePage = document.getElementById("home-page");
const gamePage = document.getElementById("game-page");

const levelButtons = document.querySelectorAll(".level-card");
const backButton = document.getElementById("back-button");
const chooseLevelButton = document.getElementById("choose-level");
const playAgainButton = document.getElementById("play-again");

const form = document.getElementById("guess-form");
const input = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");

const difficultyLabel = document.getElementById("difficulty-label");
const maxNumber = document.getElementById("max-number");
const rangeInstruction = document.getElementById("range-instruction");

const feedback = document.getElementById("feedback");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackText = document.getElementById("feedback-text");

const attemptsDisplay = document.getElementById("attempts");
const winButtons = document.getElementById("win-buttons");
const bestScores = document.getElementById("best-scores");

const wonNumber = document.getElementById("won-number");
const winMessage = document.getElementById("win-message");
const winOverlay = document.getElementById("win-overlay");

const celebrationPlayAgain =
    document.getElementById("celebration-play-again");

const winHomeButton = document.getElementById("win-home-button");

// ==================== GAME VARIABLES ====================

let currentLevel = "easy";
let luckyNumber = 0;
let attempts = 0;
let gameOver = false;
let guessedNumbers = new Set();

// ==================== REALISTIC APPLAUSE SOUND ====================

// Create the sounds folder inside MindShot.
// Put the real applause recording at sounds/applause.mp3.

const applauseSound = new Audio("sounds/applause.mp3");

applauseSound.preload = "auto";
applauseSound.volume = 0.8;

function playClappingSound() {
    try {
        applauseSound.pause();
        applauseSound.currentTime = 0;

        const playPromise = applauseSound.play();

        if (playPromise !== undefined) {
            playPromise.catch(function(error) {
                console.warn(
                    "Applause sound could not play. Check sounds/applause.mp3:",
                    error
                );
            });
        }
    } catch (error) {
        console.warn("Applause sound error:", error);
    }
}

// ==================== BEST SCORES ====================

function getBestScore(level) {
    try {
        const value = localStorage.getItem("mindshot-best-" + level);

        if (value === null) return null;

        const score = Number(value);

        return Number.isSafeInteger(score) && score > 0
            ? score
            : null;
    } catch (error) {
        return null;
    }
}

function saveBestScore(level, score) {
    try {
        const previous = getBestScore(level);

        if (previous === null || score < previous) {
            localStorage.setItem(
                "mindshot-best-" + level,
                String(score)
            );

            return true;
        }
    } catch (error) {
        console.warn("Could not save best score:", error);
    }

    return false;
}

function renderBestScores() {
    if (!bestScores) return;

    bestScores.replaceChildren();

    Object.entries(levels).forEach(function(entry) {
        const key = entry[0];
        const level = entry[1];

        const item = document.createElement("div");
        item.className = "score-item";

        const name = document.createElement("span");
        name.textContent = level.name;

        const scoreText = document.createElement("strong");
        const best = getBestScore(key);

        scoreText.textContent = best === null
            ? "Not set"
            : best + (best === 1 ? " try" : " tries");

        item.append(name, scoreText);
        bestScores.appendChild(item);
    });
}

// ==================== FEEDBACK ====================

function showFeedback(title, message, icon, type = "") {
    if (
        !feedback ||
        !feedbackIcon ||
        !feedbackTitle ||
        !feedbackText
    ) {
        return;
    }

    feedback.className = "feedback";

    if (type) {
        feedback.classList.add(type);
    }

    feedbackIcon.textContent = icon;
    feedbackTitle.textContent = title;
    feedbackText.textContent = message;
}

// ==================== START GAME ====================

function startGame(levelKey) {
    const settings = levels[levelKey];

    if (!settings) return;

    currentLevel = levelKey;
    luckyNumber = Math.floor(Math.random() * settings.max) + 1;

    attempts = 0;
    gameOver = false;
    guessedNumbers = new Set();

    if (homePage) homePage.hidden = true;
    if (gamePage) gamePage.hidden = false;
    if (winOverlay) winOverlay.hidden = true;

    if (difficultyLabel) {
        difficultyLabel.textContent = settings.name + " Challenge";
    }

    if (maxNumber) {
        maxNumber.textContent = settings.max;
    }

    if (rangeInstruction) {
        rangeInstruction.textContent =
            "You selected " + settings.name +
            "! Enter a number between 1 and " +
            settings.max + " to guess your lucky number.";
    }

    if (input) {
        input.min = "1";
        input.max = String(settings.max);
        input.step = "1";
        input.placeholder = "Enter 1–" + settings.max;
        input.value = "";
        input.disabled = false;
    }

    if (guessButton) {
        guessButton.disabled = false;
    }

    if (attemptsDisplay) {
        attemptsDisplay.textContent = "Attempts: 0";
    }

    if (winButtons) {
        winButtons.hidden = true;
    }

    showFeedback(
        "Let's play!",
        "Enter your first guess. You can do this!",
        "💭"
    );

    if (input) input.focus();
}

// ==================== CHECK GUESS ====================

function checkGuess(event) {
    event.preventDefault();

    if (gameOver || !input) return;

    const rawValue = input.value.trim();
    const guess = Number(rawValue);
    const max = levels[currentLevel].max;

    if (
        rawValue === "" ||
        !Number.isSafeInteger(guess) ||
        guess < 1 ||
        guess > max
    ) {
        showFeedback(
            "Check your number! ⚠️",
            "Enter a whole number between 1 and " + max + ".",
            "⚠️",
            "error"
        );

        input.focus();
        return;
    }

    if (guessedNumbers.has(guess)) {
        showFeedback(
            "Already tried!",
            "Choose a different number. This guess won't count again.",
            "🔄",
            "error"
        );

        input.select();
        return;
    }

    guessedNumbers.add(guess);
    attempts++;

    if (attemptsDisplay) {
        attemptsDisplay.textContent = "Attempts: " + attempts;
    }

    if (guess === luckyNumber) {
        winGame();
    } else if (guess < luckyNumber) {
        showFeedback(
            "Too Low! ⬆️",
            "Your guess is too small. Try a HIGHER number!",
            "📈",
            "hint"
        );
    } else {
        showFeedback(
            "Too High! ⬇️",
            "Your guess is too big. Try a LOWER number!",
            "📉",
            "hint"
        );
    }

    if (!gameOver && input) {
        input.value = "";
        input.focus();
    }
}

// ==================== WIN GAME ====================

function winGame() {
    gameOver = true;

    const isNewBest = saveBestScore(currentLevel, attempts);

    if (input) input.disabled = true;
    if (guessButton) guessButton.disabled = true;

    showFeedback(
        "YOU WON! 🎉",
        "Correct guess! The lucky number was " + luckyNumber + ".",
        "🥳",
        "win"
    );

    if (attemptsDisplay) {
        attemptsDisplay.textContent =
            "Game ended in " + attempts + " attempts!";
    }

    if (winButtons) {
        winButtons.hidden = true;
    }

    renderBestScores();

    let tier;

    if (attempts <= 3) {
        tier = performanceTiers.genius;
    } else if (attempts <= 10) {
        tier = performanceTiers.sharp;
    } else {
        tier = performanceTiers.comeback;
    }

    const quote = tier.quotes[
        Math.floor(Math.random() * tier.quotes.length)
    ];

    if (wonNumber) {
        wonNumber.textContent = luckyNumber;
    }

    if (winMessage) {
        winMessage.replaceChildren();

        const rating = document.createElement("strong");
        rating.className = "performance-rank " + tier.className;
        rating.textContent = tier.title;

        const quoteText = document.createElement("span");
        quoteText.className = "performance-quote";
        quoteText.textContent = quote;

        const resultText = document.createElement("span");
        resultText.className = "performance-quote";

        resultText.textContent =
            "You guessed it in " + attempts +
            (attempts === 1 ? " attempt!" : " attempts!") +
            (isNewBest ? " 🏅 New personal best!" : "");

        winMessage.append(rating, quoteText, resultText);
    }

    if (winOverlay) {
        winOverlay.hidden = false;
    }

    // Play the real applause recording after winning.
    playClappingSound();

    if (typeof createCelebration === "function") {
        createCelebration();
    }
}

// ==================== NAVIGATION ====================

function showHome() {
    if (gamePage) gamePage.hidden = true;
    if (homePage) homePage.hidden = false;
    if (winOverlay) winOverlay.hidden = true;

    renderBestScores();
}

// Difficulty buttons
levelButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        startGame(button.dataset.level);
    });
});

// Guess form
if (form) {
    form.addEventListener("submit", checkGuess);
}

// Back to home
if (backButton) {
    backButton.addEventListener("click", showHome);
}

// Choose another level from game screen
if (chooseLevelButton) {
    chooseLevelButton.addEventListener("click", showHome);
}

// Play again from game screen
if (playAgainButton) {
    playAgainButton.addEventListener("click", function() {
        startGame(currentLevel);
    });
}

// Play again from winning popup
if (celebrationPlayAgain) {
    celebrationPlayAgain.addEventListener("click", function() {
        startGame(currentLevel);
    });
}

// Return home from winning popup
if (winHomeButton) {
    winHomeButton.addEventListener("click", showHome);
}

// ==================== INITIALIZE ====================

renderBestScores();
