# Who Broke Into the House? 🔍
### An Ecobee Smart Home Security Mystery (SQL Murder Mystery style)

A browser-based detective game for Take Your Kid to Work Day. Players use
beginner-friendly SQL queries to investigate smart home device logs and
figure out who broke into the Morgan family's Ecobee-monitored house.

- Plain HTML/CSS/JS — no framework, no build step, no backend.
- Runs entirely client-side using [sql.js](https://sql.js.org) (SQLite
  compiled to WebAssembly). The database is created in memory, in the
  browser tab.
- The sql.js engine is **vendored locally** in `vendor/`, so the game works
  with no internet connection at all.

## How to run it

**Run a local static server from the project folder — this is the way to
run it, not a fallback.** Chrome silently blocks WebAssembly fetches over
`file://`, so double-clicking `index.html` can leave the database stuck on
"Loading database…" with no visible error.

```bash
cd ecobee-sql-mystery-nov-4
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

(No Python? `npx serve` works just as well, or the VS Code "Live Server"
extension.)

Stop the server afterwards with `Ctrl+C`.

## How the game works

- **The Case**: read the intro card to get the story.
- **Case Log**: five progressively-unlocked clues. Each one tells you which
  table to look at and what question to answer.
- **SQL Console**: type a query and click **Run Query** (or press
  Cmd/Ctrl+Enter). Results render as a table below. Only `SELECT` queries
  are allowed, so nobody can accidentally delete the evidence.
- **Database Tables** (sidebar): shows every table's actual columns and row
  count (read straight from the live database), so players always know
  what they can query. Click any table name to preview its first 5 rows in
  the console.
- **SQL Cheat Sheet** (sidebar): copy-paste examples for `SELECT`, `WHERE`,
  comparisons, `ORDER BY`, and combining conditions with `AND`, each with a
  **Try it** button. That's the entire SQL vocabulary needed to solve the
  case — no `JOIN`, `GROUP BY`, or subqueries required.
- Answer each clue in the **Submit This Clue's Answer** box. Correct
  answers unlock the next clue; a **hint** button is available if you get
  stuck.
- After all 5 clues are solved, make your **Final Accusation** by picking a
  suspect from the dropdown.

## The data

8 tables, seeded with a small, hand-built dataset (no real people):
`residents`, `suspects`, `devices`, `door_sensors`, `motion_events`,
`camera_logs`, `thermostat_events`, `access_logs`. Every table is fully
denormalized — the house address and the person's name live directly on
every row — so every clue is solvable with a single-table `SELECT` /
`WHERE` / `ORDER BY` query. No JOINs, ever.

The four security-event tables (`motion_events`, `door_sensors`,
`access_logs`, `camera_logs`) cover **three houses on the street**, not
just the Morgans', which is what lets players clear two of the three red
herrings themselves:

- **14 Maple Street** — the Morgan family (the crime scene)
- **12 Maple Street** — Jordan Patel, the neighbor with a spare key. His
  own house's motion sensors show him home in his bedroom at the exact
  minute of the break-in.
- **9 Birch Lane** — Alex Rivera, a classmate with a motive but no
  opportunity: zero rows for him in `access_logs`, and his own house's
  sensors show him home during the break-in window too.

The cousin, Sam Okafor, is a guest at 14 Maple Street and is cleared by
that house's own motion logs (he never leaves the Guest Room). A raccoon
caught on the backyard camera is also a built-in red herring.

## Files

```
index.html       Page structure
styles.css       Ecobee-style visual theme
seed-data.js     The case's SQLite schema + data, as a SQL script in a JS string
app.js           Game logic: loads sql.js, runs queries, tracks progress
vendor/          Locally vendored sql.js (sql-wasm.js + sql-wasm.wasm)
```
