// English UI strings for the Korean app. Functions take the values they interpolate.
export const ui = {
  tabs: { home: "Home", learn: "Learn", review: "Review", quiz: "Quiz", browse: "Browse", settings: "Settings" },
  now: "now", minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} d`,
  listen: "Listen", listenBtn: "🔊 Listen", edit: "Edit", resetProgress: "Reset progress", tapToFlip: "tap to flip",
  dueNow: "due now", ofSeen: (n) => `of ${n} seen`, unit: "unit", wordOfHour: "Word of the hour", noItems: "No items",
  changesAt: (hh) => `Changes at ${hh}:00`, currentUnit: "Current unit", unitN: (n) => `Unit ${n}`,
  introduced: (a, b, g) => `${a}/${b} introduced · ${g} grammar points`,
  learnNew: "Learn new", review: "Review", phrases: "Phrases", noKindLeft: (k) => `No new ${k.toLowerCase()} left in this unit.`,
  hourlyTip: `<h2>Hourly reminder on iPhone</h2>
    <div class="card tip">
      iOS won't let a web app set its own alarm, and Shortcuts has no "hourly" repeat — so make one <b>Daily</b> automation per hour you want (e.g. 9:00, 10:00 … 21:00):
      <ol>
        <li>Shortcuts → Automation → + → <b>Time of Day</b> → repeat <b>Daily</b>, choose <b>Run Immediately</b>.</li>
        <li>Action: <b>Open App</b> → this app, if it appears in the list after Add to Home Screen.</li>
        <li>If it doesn't, use <b>Open URL</b> with this page's address. That opens Safari, which keeps its own separate progress — so the word it shows may not match this app.</li>
      </ol>
    `,
  unitDone: "Unit done", unitDoneHint: "Every item here has been introduced. Pick the next unit above or go review.",
  leechTip: (n) => `🩹 Missed ${n} times. In Browse, tap 🩹 to find it and edit it: add a note, a memory trick or your own example.`,
  jumpedAhead: "Jumped ahead — the previous unit isn't finished yet. That's fine.",
  leftInUnit: (n) => `${n} left in this unit`, gotIt: "Got it", alreadyKnew: "Already knew", reviewIn: (x) => `review in ${x}`,
  showMeaning: "Show meaning", nothingDue: "Nothing due", nextReview: (x) => `Next review in ${x}.`, learnFirst: "Learn some new words first.",
  nDue: (n) => `${n} due`, again: "Again", hard: "Hard", good: "Good", easy: "Easy", showAnswer: "Show answer",
  searchPlaceholder: "Search 한글 · 漢字 · 中文 · English", all: "All", words: "Words", grammar: "Grammar", add: "+ Add", anyLevel: "Any level",
  nItems: (n) => `${n} items`, statusNew: "new", statusDue: "due", statusIn: (x) => `in ${x}`, showingFirst: "Showing first 200 — narrow the search.",
  studyTrack: "Study track", data: "Data", exportBackup: "Export backup", importBackup: "Import backup",
  theme: (x) => `Theme: ${x}`, resetAll: "Reset all progress",
  progressNote: "Progress lives in this browser only. Export before clearing Safari data or switching phones.",
  packLine: (id, w, g, c) => `Pack: ${id} · ${w} words · ${g} grammar · ${c} custom`,
  confirmWipe: "Erase all progress on this device? Custom words are kept.",
  confirmImport: "Replace the progress AND custom words on this device with the backup?",
  noSpeech: "This browser has no speech voices.", noVoice: "No matching voice is installed.",
  dictAdded: (u) => `Added to ${u}.`, dictTitle: "Dictionary", dictLoading: "Loading the dictionary…", dictError: "Dictionary not available — open Browse once while online.", dictNone: "No dictionary entries.", dictAdd: "+ Add to study", dictSource: "Dictionary: Wiktionary via kaikki.org, CC BY-SA 4.0.",
  speechCheck: "Speech check", speechCheckBtn: "🔊 Test speech and show details",
  quizPractice: "Practice quiz", quizPracticeHint: "10 questions from words you've seen, weakest first. No pass mark.",
  quizNeedSeen: "Learn at least 4 items first.", quizUnits: "Unit tests", quizNotReady: (n) => `${n} left to learn`,
  quizReady: "Test ready", quizPassed: (b, n) => `🏅 Passed · best ${b}/${n}`, quizStart: "Start", quizNext: "Next",
  quizQn: (i, n) => `Question ${i} of ${n}`, quizResult: (s, n) => `${s}/${n} · ${Math.round((s / n) * 100)}%`,
  quizPass: "Passed — 80% or more 🏅", quizNotYet: "Not yet — 80% passes. Missed words are due in Review now.",
  quizMissed: "Missed", quizRetake: "Retake", quizBack: "All tests", quizTestReady: (label) => `${label} — test ready`, quizReplay: "Play again",
  qMeaning: "What does it mean?", qReverse: "Which Korean word?", qHanja: "How is it read?", qListen: "Which word did you hear?",
  qGrammar: "Which grammar point is used?", qSound: "What does it mean?", qSay: "How do you say it?", qTone: "Which tone?", qGsound: "What does it mean?",
};
