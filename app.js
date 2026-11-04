// ===========================================================================
// "Who Broke Into the House?" — game logic
// Runs the whole game against an in-memory SQLite database via sql.js.
// ===========================================================================

const QUESTIONS = [
  {
    title: "Clue #1 — Movement in the Dark",
    table: "motion_events",
    prompt: "Before the alarm was disarmed last night, something was moving around outside the house. Take a look at <code>motion_events</code> for 14 Maple Street — which location picked up movement?",
    hint: "Try: SELECT * FROM motion_events WHERE house_address = '14 Maple Street' AND event_time > '2026-11-04 00:00:00' ORDER BY event_time;",
    accepted: ["side yard", "sideyard"],
    successText: "The <strong>Side Yard</strong> sensor picked up movement at 2:08 AM — just two minutes before the alarm was disarmed. Someone was creeping around outside."
  },
  {
    title: "Clue #2 — Who Turned Off the Alarm?",
    table: "access_logs",
    prompt: "The alarm wasn't broken into — someone turned it off using a real access code. Check <code>access_logs</code> for 14 Maple Street — whose name is on it?",
    hint: "Add ORDER BY event_time; to the query so the entries line up in time order — look for the one around 2:10 AM.",
    accepted: ["riley chen", "riley"],
    successText: "<strong>Riley Chen's</strong> keypad code was used to disarm the system at 2:10 AM — in the middle of the night, when she had no reason to be there."
  },
  {
    title: "Clue #3 — The Unlocked Door",
    table: "door_sensors",
    prompt: "Right after the alarm went down, a door sensor at 14 Maple Street logged something. Check <code>door_sensors</code> — which door was it?",
    hint: "Compare the event_time column on each row — which one happened right after 2:10 AM?",
    accepted: ["back door", "backdoor"],
    successText: "The <strong>Back Door</strong> was unlocked at 2:14 AM — four minutes after the alarm was disarmed."
  },
  {
    title: "Clue #4 — Caught on Camera",
    table: "camera_logs",
    prompt: "A camera near the back door should have caught whoever came in. Check <code>camera_logs</code> for 14 Maple Street — what did it see, and what were they carrying?",
    hint: "There are two Kitchen rows — one from the evening before, and one in the middle of the night. Compare the event_time and look at detected_object and item_seen.",
    accepted: ["person"],
    successText: "At 2:16 AM, the Kitchen camera detected a <strong>Person</strong> carrying a <strong>dog-leash bag</strong>."
  },
  {
    title: "Clue #5 — Matching the Suspect",
    table: "suspects",
    prompt: "The camera caught a clue about what the intruder was carrying. Check the <code>suspects</code> table — who matches it?",
    hint: "Try: SELECT * FROM suspects WHERE usually_carries = 'Dog-leash bag';",
    accepted: ["riley chen", "riley"],
    successText: "<strong>Riley Chen</strong> — the dog walker — is the only suspect whose profile lists a dog-leash bag. And her alibi says she was nowhere near the house that night..."
  }
];

const CORRECT_SUSPECT = "riley chen";
const CASE_SOLVED_EXPLANATION = `
  <p><strong>Case closed!</strong> 🎉</p>
  <p>Riley Chen, the Morgans' dog walker, used her keypad code to disarm the alarm at 2:10 AM,
  then let herself in through the back door at 2:14 AM. The Kitchen camera caught her carrying
  her dog-leash bag — the same item listed in her suspect file. Her alibi about being at a
  birthday party doesn't match the evidence at all.</p>
  <p><strong>What about the other suspects?</strong> Try querying their own house's logs:</p>
  <ul>
    <li><strong>Jordan Patel</strong> (12 Maple Street) — his own motion sensors show him in his bedroom at 2:14 AM, the exact moment the Morgans' back door was unlocked.</li>
    <li><strong>Sam Okafor</strong> — motion logs show he never left the Guest Room all night.</li>
    <li><strong>Alex Rivera</strong> (9 Birch Lane) — has no access code on record anywhere, and his own house's sensors show him home at 2:17 AM.</li>
  </ul>
`;
const CASE_WRONG_EXPLANATION = `
  <p>That's not quite right, detective. Think back through the clues:</p>
  <ul>
    <li>Whose <strong>access code</strong> disarmed the alarm at 2:10 AM?</li>
    <li>Whose row in the <strong>suspects</strong> table has <code>usually_carries</code> set to the item seen on camera?</li>
  </ul>
  <p>Review the case log above and try again.</p>
`;

const CHEATSHEET_ITEMS = [
  {
    heading: "See everything in a table",
    code: "SELECT * FROM motion_events;",
    note: "<code>*</code> means \"all columns\". This shows every row."
  },
  {
    heading: "Pick specific columns",
    code: "SELECT location, event_time FROM motion_events;",
    note: "Only shows the columns you list, in that order."
  },
  {
    heading: "Filter rows with WHERE",
    code: "SELECT * FROM camera_logs WHERE location = 'Kitchen';",
    note: "Text values go in single quotes. Only matching rows show up."
  },
  {
    heading: "Comparisons",
    code: "SELECT * FROM access_logs WHERE action != 'Armed';",
    note: "Use <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code> to compare values."
  },
  {
    heading: "Sort with ORDER BY",
    code: "SELECT * FROM door_sensors ORDER BY event_time;",
    note: "Add <code>DESC</code> at the end to sort newest-first instead."
  },
  {
    heading: "Combine conditions with AND",
    code: "SELECT * FROM motion_events WHERE house_address = '14 Maple Street' AND location = 'Kitchen';",
    note: "Every event table covers the whole street, so you'll usually filter by <code>house_address</code> AND something else at the same time."
  }
];

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let db = null;
let currentQuestionIndex = 0;
const solvedAnswers = [];

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  renderCheatsheet();
  wireStaticHandlers();
  boot();
});

function cacheElements() {
  els.caseLog = document.getElementById("case-log");
  els.sqlInput = document.getElementById("sql-input");
  els.runBtn = document.getElementById("run-btn");
  els.dbStatus = document.getElementById("db-status");
  els.queryError = document.getElementById("query-error");
  els.resultsWrapper = document.getElementById("results-wrapper");
  els.answerPanel = document.getElementById("answer-panel");
  els.answerQuestionLabel = document.getElementById("answer-question-label");
  els.answerInput = document.getElementById("answer-input");
  els.submitAnswerBtn = document.getElementById("submit-answer-btn");
  els.hintBtn = document.getElementById("hint-btn");
  els.hintText = document.getElementById("hint-text");
  els.answerFeedback = document.getElementById("answer-feedback");
  els.accusationPanel = document.getElementById("accusation-panel");
  els.suspectSelect = document.getElementById("suspect-select");
  els.accuseBtn = document.getElementById("accuse-btn");
  els.accusationResult = document.getElementById("accusation-result");
  els.schemaBrowser = document.getElementById("schema-browser");
  els.cheatsheet = document.getElementById("cheatsheet");
}

function boot() {
  if (typeof initSqlJs !== "function") {
    fatalError("Could not find sql.js. Make sure vendor/sql-wasm.js loaded correctly.");
    return;
  }
  initSqlJs({ locateFile: (file) => `vendor/${file}` })
    .then((SQL) => {
      db = new SQL.Database();
      db.run(SEED_SQL);
      els.dbStatus.textContent = "✅ Database loaded — 8 tables ready.";
      renderSchemaBrowser();
      renderCaseLog();
      renderAnswerPanel();
    })
    .catch((err) => {
      console.error(err);
      fatalError(
        "sql.js failed to load. If you opened this file directly by double-clicking it, " +
        "your browser may be blocking local file access. Try running a local server instead " +
        "(see README.md) — e.g. `python3 -m http.server` from this folder, then open " +
        "http://localhost:8000."
      );
    });
}

function fatalError(message) {
  els.dbStatus.textContent = "⚠️ Failed to load";
  els.queryError.hidden = false;
  els.queryError.textContent = message;
  els.runBtn.disabled = true;
}

// ---------------------------------------------------------------------------
// SQL console
// ---------------------------------------------------------------------------
const FORBIDDEN_KEYWORDS = /\b(drop|delete|update|insert|alter|attach|detach|pragma|vacuum|replace)\b/i;

function wireStaticHandlers() {
  els.runBtn.addEventListener("click", () => runCurrentQuery());
  els.sqlInput.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runCurrentQuery();
  });
  els.submitAnswerBtn.addEventListener("click", submitAnswer);
  els.answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAnswer();
  });
  els.hintBtn.addEventListener("click", () => {
    els.hintText.hidden = !els.hintText.hidden;
  });
  els.accuseBtn.addEventListener("click", submitAccusation);
}

function runCurrentQuery() {
  const sql = els.sqlInput.value.trim();
  els.queryError.hidden = true;
  els.resultsWrapper.innerHTML = "";

  if (!sql) return;

  if (!db) {
    showQueryError("The database is still loading — give it a second and try again.");
    return;
  }

  if (FORBIDDEN_KEYWORDS.test(sql)) {
    showQueryError("For this game, let's stick to SELECT queries so the evidence doesn't get erased! 🕵️");
    return;
  }

  try {
    const results = db.exec(sql);
    renderResults(results);
  } catch (err) {
    showQueryError(err.message);
  }
}

function showQueryError(message) {
  els.queryError.hidden = false;
  els.queryError.textContent = "⚠️ " + message;
}

function renderResults(results) {
  if (!results || results.length === 0) {
    els.resultsWrapper.innerHTML = `<p class="results-meta">Query ran successfully, but didn't return any rows.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  results.forEach((res) => {
    const meta = document.createElement("p");
    meta.className = "results-meta";
    meta.textContent = `${res.values.length} row${res.values.length === 1 ? "" : "s"} returned`;
    frag.appendChild(meta);

    const table = document.createElement("table");
    table.className = "results-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    res.columns.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    res.values.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        if (cell === null) {
          td.textContent = "NULL";
          td.className = "null-cell";
        } else {
          td.textContent = String(cell);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    frag.appendChild(table);
  });

  els.resultsWrapper.innerHTML = "";
  els.resultsWrapper.appendChild(frag);
}

function fillAndRun(query) {
  els.sqlInput.value = query;
  runCurrentQuery();
  els.sqlInput.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ---------------------------------------------------------------------------
// Case log (progressive questions)
// ---------------------------------------------------------------------------
function renderCaseLog() {
  els.caseLog.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const card = document.createElement("div");
    if (i < currentQuestionIndex) {
      card.className = "clue-card solved";
      card.innerHTML = `
        <div class="clue-title">${q.title} <span class="clue-status solved-badge">✅ Solved</span></div>
        <div class="clue-success">${q.successText}</div>
        <div class="clue-your-answer">Your answer: "${escapeHtml(solvedAnswers[i])}"</div>
      `;
    } else if (i === currentQuestionIndex) {
      card.className = "clue-card active";
      card.innerHTML = `
        <div class="clue-title">${q.title} <span class="clue-status active-badge">🔎 Active</span></div>
        <p class="clue-prompt">${q.prompt}</p>
        <span class="clue-table-tag">table: ${q.table}</span>
      `;
    } else {
      card.className = "clue-card locked";
      card.innerHTML = `
        <div class="clue-title">🔒 Clue #${i + 1} — ??? <span class="clue-status locked-badge">Locked</span></div>
        <p class="clue-prompt">Solve the clue above to unlock this one.</p>
      `;
    }
    els.caseLog.appendChild(card);
  });
}

function renderAnswerPanel() {
  if (currentQuestionIndex >= QUESTIONS.length) {
    els.answerPanel.hidden = true;
    revealAccusationPanel();
    return;
  }
  const q = QUESTIONS[currentQuestionIndex];
  els.answerPanel.hidden = false;
  els.answerQuestionLabel.innerHTML = `<strong>${q.title}:</strong> what's your answer?`;
  els.answerInput.value = "";
  els.hintText.hidden = true;
  els.hintText.textContent = q.hint;
  els.answerFeedback.hidden = true;
}

function normalize(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function answerMatches(userAnswer, accepted) {
  const n = normalize(userAnswer);
  if (!n) return false;
  return accepted.some((a) => {
    const na = normalize(a);
    return n === na || n.includes(na) || na.includes(n);
  });
}

function submitAnswer() {
  const q = QUESTIONS[currentQuestionIndex];
  const userAnswer = els.answerInput.value;

  if (answerMatches(userAnswer, q.accepted)) {
    solvedAnswers[currentQuestionIndex] = userAnswer.trim();
    currentQuestionIndex += 1;
    els.answerFeedback.hidden = false;
    els.answerFeedback.className = "answer-feedback correct";
    els.answerFeedback.textContent = "✅ Correct! New clue unlocked below.";
    renderCaseLog();
    renderAnswerPanel();

    setTimeout(() => {
      const target = currentQuestionIndex < QUESTIONS.length
        ? els.caseLog.children[currentQuestionIndex]
        : els.accusationPanel;
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  } else {
    els.answerFeedback.hidden = false;
    els.answerFeedback.className = "answer-feedback incorrect";
    els.answerFeedback.textContent = "❌ Not quite. Try running a query on the table above, or click \"Need a hint?\"";
  }
}

function revealAccusationPanel() {
  els.accusationPanel.hidden = false;
}

function submitAccusation() {
  const choice = els.suspectSelect.value;
  if (!choice) return;
  const result = document.getElementById("accusation-result");
  result.hidden = false;
  if (normalize(choice) === normalize(CORRECT_SUSPECT)) {
    result.className = "accusation-result win";
    result.innerHTML = CASE_SOLVED_EXPLANATION;
  } else {
    result.className = "accusation-result lose";
    result.innerHTML = CASE_WRONG_EXPLANATION;
  }
  result.scrollIntoView({ behavior: "smooth", block: "center" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Sidebar: schema browser
// ---------------------------------------------------------------------------
function renderSchemaBrowser() {
  const tableNames = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")[0].values.map((r) => r[0]);

  els.schemaBrowser.innerHTML = "";
  tableNames.forEach((name) => {
    const cols = db.exec(`PRAGMA table_info("${name}");`)[0].values.map((r) => r[1]);
    const count = db.exec(`SELECT COUNT(*) FROM "${name}";`)[0].values[0][0];

    const wrap = document.createElement("div");
    wrap.className = "schema-table";
    wrap.innerHTML = `
      <div class="schema-table-head">
        <button type="button" class="schema-table-name">${name}</button>
        <span class="schema-row-count">${count} rows</span>
      </div>
      <div class="schema-columns">
        ${cols.map((c) => `<span class="col-chip">${c}</span>`).join("")}
      </div>
    `;
    wrap.querySelector(".schema-table-name").addEventListener("click", () => {
      fillAndRun(`SELECT * FROM ${name} LIMIT 5;`);
    });
    els.schemaBrowser.appendChild(wrap);
  });

  // Populate the accusation dropdown from the suspects table
  const suspects = db.exec("SELECT name FROM suspects ORDER BY name;")[0].values.map((r) => r[0]);
  suspects.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    els.suspectSelect.appendChild(opt);
  });
}

// ---------------------------------------------------------------------------
// Sidebar: cheat sheet
// ---------------------------------------------------------------------------
function renderCheatsheet() {
  els.cheatsheet.innerHTML = CHEATSHEET_ITEMS.map((item, i) => `
    <div class="cheat-item">
      <h4>${item.heading}</h4>
      <pre>${escapeHtml(item.code)}</pre>
      <p>${item.note}</p>
      <button type="button" class="cheat-try" data-idx="${i}">Try it ▶</button>
    </div>
  `).join("");

  els.cheatsheet.querySelectorAll(".cheat-try").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      fillAndRun(CHEATSHEET_ITEMS[idx].code);
    });
  });
}
