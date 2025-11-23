const CONFIG = {
  DATA: {
    LETTERS: ["A", "B"],
    MIN_TOTAL: 100,
    MAX_TOTAL: 1000,
    MIN_VALUE: 1,
  },
  COLORS: {
    CORRECT: "lightgreen",
    INCORRECT: "red",
  },
};

const state = {
  narrationData: null,
  questionTemplates: [],
  currentQuestion: null,
  currentAnswer: null,
  pageStartTime: Date.now(),
  lastSubmitTime: null,
  correctCount: 0,
  totalAttempts: 0,
  currentQuestionSubmitted: false,
};

class NarrationDataManager {
  constructor() {
    this.data = null;
  }

  randomize() {
    const total1Steps = Math.floor(Math.random() * 10) + 1;
    const total1 = total1Steps * 100;

    const A1Percent = (Math.floor(Math.random() * 8) + 1) * 10;
    const A1 = (A1Percent / 100) * total1;
    const B1 = total1 - A1;

    let total2Steps;
    do {
      total2Steps = Math.floor(Math.random() * 10) + 1;
    } while (total2Steps === total1Steps);
    const total2 = total2Steps * 100;

    let A2Percent;
    do {
      A2Percent = (Math.floor(Math.random() * 8) + 1) * 10;
    } while (A2Percent === A1Percent);
    const A2 = (A2Percent / 100) * total2;
    const B2 = total2 - A2;

    const totalChange = total2 - total1;
    const totalPercentChange = total1 !== 0 ? (totalChange / total1) * 100 : 0;

    const AChange = A2 - A1;
    const APercentChange = A1 !== 0 ? (AChange / A1) * 100 : 0;

    const BChange = B2 - B1;
    const BPercentChange = B1 !== 0 ? (BChange / B1) * 100 : 0;

    this.data = {
      period1: {
        total: total1,
        A: A1,
        B: B1,
      },
      period2: {
        total: total2,
        A: A2,
        B: B2,
      },
      changes: {
        total: {
          numerical: totalChange,
          percent: totalPercentChange,
        },
        A: {
          numerical: AChange,
          percent: APercentChange,
        },
        B: {
          numerical: BChange,
          percent: BPercentChange,
        },
      },
    };

    return this.data;
  }

  getData() {
    return this.data;
  }

  getValue(letter, period) {
    if (!this.data) return 0;
    return this.data[`period${period}`][letter];
  }

  getTotal(period) {
    if (!this.data) return 0;
    return this.data[`period${period}`].total;
  }

  getChange(subject, type) {
    if (!this.data) return 0;
    return this.data.changes[subject][type];
  }
}

class NarrationRenderer {
  constructor() {
    this.containers = {
      narration1: document.getElementById("narration-1"),
      narration2: document.getElementById("narration-2"),
      narration3: document.getElementById("narration-3"),
      narration4: document.getElementById("narration-4"),
    };
  }

  render(data) {
    if (!data) return;

    this.containers.narration1.innerHTML = `Total data in period 1 was <strong>${data.period1.total}</strong>`;

    const totalChange = data.changes.total.numerical;
    const totalPercentChange = data.changes.total.percent;
    const totalDirection = totalChange >= 0 ? "increased" : "decreased";

    const usePercent = Math.random() < 0.5;
    const changeText = usePercent
      ? `${Math.abs(totalPercentChange).toFixed(2)}%`
      : `${Math.abs(totalChange)}`;

    this.containers.narration2.innerHTML = `Total data in period 2 was <strong>${totalDirection}</strong> by <strong>${changeText}</strong>`;

    this.containers.narration3.innerHTML = `Data for A in period 1 is <strong>${data.period1.A}</strong>`;

    const BChange = data.changes.B.numerical;
    const BPercentChange = data.changes.B.percent;
    const BDirection = BChange >= 0 ? "increased" : "decreased";

    const useBPercent = Math.random() < 0.5;
    const BChangeText = useBPercent
      ? `${Math.abs(Math.abs(BPercentChange).toFixed(2))}%`
      : `${Math.abs(BChange)}`;

    this.containers.narration4.innerHTML = `Data for B in period 2 is <strong>${BDirection}</strong> by <strong>${BChangeText}</strong> from period 1`;
  }
}

class QuestionGenerator {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  static pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  generateVariables(variableNames) {
    const vars = {};

    variableNames.forEach((varName) => {
      if (varName === "letter") {
        vars[varName] = QuestionGenerator.pickRandom(CONFIG.DATA.LETTERS);
      }
      if (varName === "period") {
        vars[varName] = QuestionGenerator.pickRandom(["1", "2"]);
      }
    });

    return vars;
  }

  calculateAnswer(type, vars) {
    const data = this.dataManager.getData();
    if (!data) return null;

    switch (type) {
      case "percentContribution":
        return this.calculatePercentContribution(vars, data);

      case "numericalLetterChange":
        return this.calculateNumericalLetterChange(vars, data);

      case "percentLetterChange":
        return this.calculatePercentLetterChange(vars, data);

      case "numericalTotalChange":
        return this.calculateNumericalTotalChange(data);

      case "percentTotalChange":
        return this.calculatePercentTotalChange(data);

      case "periodBestLetter":
        return this.findPeriodBestLetter(vars, data);

      case "periodWorstLetter":
        return this.findPeriodWorstLetter(vars, data);

      case "totalBestLetter":
        return this.findTotalBestLetter(data);

      case "totalWorstLetter":
        return this.findTotalWorstLetter(data);

      case "bestLetterChange":
        return this.findBestLetterChange(data);

      case "worstLetterChange":
        return this.findWorstLetterChange(data);

      case "bestPeriod":
        return this.findBestPeriod(data);

      case "worstPeriod":
        return this.findWorstPeriod(data);

      default:
        console.warn(`Unknown question type: ${type}`);
        return null;
    }
  }

  calculatePercentContribution(vars, data) {
    const period = vars.period;
    const letter = vars.letter;
    const letterValue = data[`period${period}`][letter];
    const total = data[`period${period}`].total;

    if (total === 0) return "0%";

    const percentage = (letterValue / total) * 100;
    return `${percentage}%`;
  }

  calculateNumericalLetterChange(vars, data) {
    const letter = vars.letter;
    return data.changes[letter].numerical;
  }

  calculatePercentLetterChange(vars, data) {
    const letter = vars.letter;
    const percentChange = data.changes[letter].percent;
    return `${Math.round(percentChange)}%`;
  }

  calculateNumericalTotalChange(data) {
    return data.changes.total.numerical;
  }

  calculatePercentTotalChange(data) {
    const percentChange = data.changes.total.percent;
    return `${Math.round(percentChange)}%`;
  }

  findPeriodBestLetter(vars, data) {
    const period = vars.period;
    const A = data[`period${period}`].A;
    const B = data[`period${period}`].B;
    return A > B ? "A" : "B";
  }

  findPeriodWorstLetter(vars, data) {
    const period = vars.period;
    const A = data[`period${period}`].A;
    const B = data[`period${period}`].B;
    return A < B ? "A" : "B";
  }

  findTotalBestLetter(data) {
    const totalA = data.period1.A + data.period2.A;
    const totalB = data.period1.B + data.period2.B;
    return totalA > totalB ? "A" : "B";
  }

  findTotalWorstLetter(data) {
    const totalA = data.period1.A + data.period2.A;
    const totalB = data.period1.B + data.period2.B;
    return totalA < totalB ? "A" : "B";
  }

  findBestLetterChange(data) {
    const AChange = Math.abs(data.changes.A.percent);
    const BChange = Math.abs(data.changes.B.percent);
    return AChange > BChange ? "A" : "B";
  }

  findWorstLetterChange(data) {
    const AChange = Math.abs(data.changes.A.percent);
    const BChange = Math.abs(data.changes.B.percent);
    return AChange < BChange ? "A" : "B";
  }

  findBestPeriod(data) {
    return data.period1.total > data.period2.total ? "1" : "2";
  }

  findWorstPeriod(data) {
    return data.period1.total < data.period2.total ? "1" : "2";
  }

  generate() {
    if (!state.questionTemplates.length || !this.dataManager.getData()) {
      console.warn("Cannot generate question: missing templates or data");
      return null;
    }

    const template = QuestionGenerator.pickRandom(state.questionTemplates);
    const variables = this.generateVariables(template.variables);
    const answer = this.calculateAnswer(template.type, variables);

    let questionText = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      questionText = questionText.replace(`{${key}}`, value);
    });

    state.currentQuestion = questionText;
    state.currentAnswer = answer;

    return { question: questionText, answer };
  }
}

class UIController {
  constructor() {
    this.elements = {
      questionDisplay: document.querySelector(".questions"),
      answerInput: document.getElementById("answerInput"),
      feedback: document.getElementById("feedback"),
      answerDiv: null,
      score: document.getElementById("score"),
      lastTime: document.getElementById("last-time"),
      totalTime: document.getElementById("total-time"),
    };
  }

  displayQuestion(question, answer) {
    this.elements.questionDisplay.innerHTML = `
      <strong>${question}</strong><br>
      <div id="answer" style="display:none;">Answer: ${answer}</div>
    `;
    this.clearInput();
    this.clearFeedback();
    this.updateAnswerElement();
  }

  updateAnswerElement() {
    this.elements.answerDiv = document.getElementById("answer");
  }

  clearInput() {
    this.elements.answerInput.value = "";
  }

  clearFeedback() {
    this.elements.feedback.textContent = "";
    this.elements.feedback.style.color = "";
  }

  showAnswer() {
    if (this.elements.answerDiv) {
      this.elements.answerDiv.style.display = "block";
    }
  }

  showFeedback(isCorrect) {
    this.elements.feedback.textContent = isCorrect ? "Correct." : "Wrong";
    this.elements.feedback.style.color = isCorrect
      ? CONFIG.COLORS.CORRECT
      : CONFIG.COLORS.INCORRECT;
  }

  updateScore() {
    this.elements.score.textContent = `Score: ${state.correctCount}/${state.totalAttempts}`;
  }

  updateLastTime(seconds) {
    this.elements.lastTime.textContent = `Last time spent: ${this.formatTime(
      seconds
    )}`;
  }

  updateTotalTime() {
    const totalSeconds = (Date.now() - state.pageStartTime) / 1000;
    this.elements.totalTime.textContent = `Total time spent: ${this.formatTime(
      totalSeconds
    )}`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  getUserAnswer() {
    return this.elements.answerInput.value;
  }
}

class AnswerValidator {
  static normalize(answer, expectedHasPercent = false) {
    if (answer == null) return "";

    let normalized = String(answer).trim().toLowerCase();
    normalized = normalized.replace(/,/g, "");

    const num = parseFloat(normalized.replace("%", ""));
    if (!isNaN(num)) {
      if (expectedHasPercent) {
        return `${Math.abs(num)}%`;
      } else {
        return Math.abs(num);
      }
    }

    return normalized;
  }

  static isCorrect(userAnswer, correctAnswer) {
    const normalizedUser = this.normalize(userAnswer);
    const normalizedCorrect = this.normalize(correctAnswer);
    return normalizedUser === normalizedCorrect;
  }
}

class QuizApp {
  constructor() {
    this.dataManager = new NarrationDataManager();
    this.narrationRenderer = new NarrationRenderer();
    this.questionGenerator = new QuestionGenerator(this.dataManager);
    this.uiController = new UIController();
    this.initialize();
  }

  async initialize() {
    await this.loadQuestionTemplates();
    this.setupEventListeners();
    this.startTimers();
    this.initializeNarrationAndQuestion();
  }

  async loadQuestionTemplates() {
    try {
      const response = await fetch("q.json");
      state.questionTemplates = await response.json();
    } catch (error) {
      console.error("Error loading q.json:", error);
      alert("Could not load q.json.");
    }
  }

  setupEventListeners() {
    document
      .getElementById("questionButton")
      .addEventListener("click", () => this.generateNewQuestion());

    document
      .getElementById("answerButton")
      .addEventListener("click", () => this.uiController.showAnswer());

    document
      .getElementById("randomizeButton")
      .addEventListener("click", () => this.handleRandomize());

    document
      .getElementById("submitAnswerButton")
      .addEventListener("click", () => this.handleSubmit());

    this.uiController.elements.answerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSubmit();
    });
  }

  startTimers() {
    setInterval(() => this.uiController.updateTotalTime(), 1000);
  }

  initializeNarrationAndQuestion() {
    this.randomizeNarration();
    this.generateNewQuestion();
  }

  randomizeNarration() {
    const data = this.dataManager.randomize();
    state.narrationData = data;
    this.narrationRenderer.render(data);
  }

  generateNewQuestion() {
    const result = this.questionGenerator.generate();
    if (result) {
      this.uiController.displayQuestion(result.question, result.answer);
      state.currentQuestionSubmitted = false;
    }
  }

  handleRandomize() {
    this.randomizeNarration();
    this.generateNewQuestion();
  }

  handleSubmit() {
    if (state.currentQuestionSubmitted) return;

    const userAnswer = this.uiController.getUserAnswer();
    const isCorrect = AnswerValidator.isCorrect(
      userAnswer,
      state.currentAnswer
    );

    state.totalAttempts++;
    if (isCorrect) state.correctCount++;

    this.uiController.updateScore();
    this.uiController.showFeedback(isCorrect);

    const now = Date.now();
    if (state.lastSubmitTime) {
      const elapsedSeconds = (now - state.lastSubmitTime) / 1000;
      this.uiController.updateLastTime(elapsedSeconds);
    }
    state.lastSubmitTime = now;

    state.currentQuestionSubmitted = true;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new QuizApp());
} else {
  new QuizApp();
}
