# "Describe My System": AI skillset design

**Date:** 2026-10-28
**Status:** Proposed design — awaiting owner approval. Nothing is built.
**Owner:** Shawn K. Lewis

## Goal

Give a reader of crudandlogic.com something to do tonight. They install an Agent Skill into the assistant they already use, answer questions about a system they want built, and end the session with a folder of files on their own disk that describes that system. The folder is useful immediately as a build brief; it is also the thing they bring with them if and when the CRUD and Logic runtime ships, so they arrive with their system described instead of facing a blank screen.

The site's problem is that it asks people to care about software that does not exist and gives them nothing to do. This is the answer to that, and it only works if the folder has value with no runtime behind it.

## Decisions

| Topic | Decision |
|---|---|
| Deliverable | An Agent Skill (agent-plugins.org 1.0.0 plugin carrying one skill), not a worksheet, PDF or template repo |
| Skill name | `describe-my-system` |
| Plugin name | `crud-and-logic` (room for sibling skills later) |
| Repo | **New** public repo `shawnklewis/crudandlogic-skills`, not this one — see *Why a separate repo* |
| Interview length | 27 questions in 11 sections, run across three sittings; sections 1–4 alone produce a usable folder |
| Output format | Markdown files with YAML frontmatter. The frontmatter is the structured data; the prose is the human explanation |
| XML Documents | **Not written by users.** See *Why the output is not the Document format* |
| Conversion path | Frontmatter is versioned (`schema: dms/1`) so an exporter can be written later against folders that already exist. No exporter in v1 |
| Install | `npx skills add`, Claude Code plugin marketplace, Codex, Cursor, VS Code/Copilot, plus a zip for claude.ai and a paste-only fallback |
| MCP server | None. No `mcp.json` in v1 |
| Done-ness | Three named readiness levels (Sketch / Describable / Buildable), not a percentage |
| Cost | Free and public. No email gate — the Substack subscribe block already covers that job |
| Telemetry | None |

---

## Why the output is not the Document format

The brief asks whether the skill should write the XML-framed Document format the site describes. It should not, and the reason is not just "users should not write XML."

A Document is a runtime artifact. The site is explicit: a Document carries the context for one *instance* of a business process, Pages accumulate inside it as workers do their jobs, and the file under version control is the record of that particular order or job. A reader describing a system they want built is not producing a travelling case file. They are producing the thing one level up — the description of the business that the site says a domain interpreter turns into a pipeline of worker programs.

So in CRUD and Logic's own vocabulary, the interview's output is a *business description*, and Documents are what the system it describes will later carry. Writing the interview's answers as XML Documents would be a category error dressed as fidelity.

That also disposes of the tension in the brief. "Documents are the source of truth" is a claim about the runtime, not about requirements capture, so it does not argue for making users write XML. The honest version of the fidelity argument is weaker and still satisfied: the output should be structured enough to be converted mechanically, and it is, because every structured fact lives in frontmatter under a versioned schema.

One further reason to stay in Markdown: the business description language does not have a syntax yet. The site calls domain interpreters planned work and labels its example business description "a conceptual example, not a released language syntax." Shipping a skill that writes a format the project has not defined would commit the project to that format by accident.

---

## What the interview asks

The assistant does not read these out as a form. Three rules govern delivery, and they matter more than the question list:

1. **Draft, then correct.** After the nouns and the first flow, the assistant proposes the rest and asks the user to correct it. Blank-page questions are what makes this feel like homework. "Here is my guess, is that right?" is the default mode.
2. **Never record a guess as fact.** Every file and every field carries `status: confirmed | drafted | unknown`. The assistant writes `confirmed` only on an explicit yes from the user.
3. **Deflect screens into decisions.** Users describe screens — "I need a page with a grid." The assistant asks what decision that screen supports, and records the decision.

Anything the user does not know goes to `open-questions.md` with who can answer it and whether it blocks a build. "I don't know, ask Mary in accounts" is a result, not a failure.

### Section 1 — The system  → `system.md`

1. In one sentence, what is this system for?
2. What should it not do — anything you would rather keep in the tools you already use?

### Section 2 — Actors  → `actors/<actor>.md`

3. Who will use this, by job rather than by name?
4. Does anything other than a person put work in or take work out — a website, a scanner, another system, a scheduled job?

The assistant then drafts one file per actor with a guessed one-line responsibility and asks for corrections.

### Section 3 — Records  → `records/<record>.md`

5. What does this system keep track of? Just the names of the things — orders, jobs, customers, shifts.
6. For each: when you are looking at one <thing>, what do you need to see?
7. Which of those things cannot exist without another one?

Field kinds and required-ness are drafted by the assistant, never asked field by field.

### Section 4 — The main flow  → `flows/<flow>.md`

8. Pick the one thing this system must get right. Tell me what happens from the moment it starts to the moment someone can say it is done.
9. Where does that start — who or what sets it off?
10. (Readback) I have split that into these steps. Is each one a single job, and is anything missing?
11. For each step: what does this step need to already know, and what does it leave behind?

Question 11 is the step's contract — the site's inputs-and-outputs idea, asked without the word "contract."

### Section 5 — Rules and permissions  → `rules/permissions.md`

This section is the highest-value output in the folder, because nobody writes it down and every app builder gets it wrong. The brainstorm's example question belongs here, and it earns its place by surfacing a rule rather than a field.

12. For each thing on your list, who creates it?
13. Who is allowed to delete a <thing>? And once it has been <approved / sent / paid>, can anyone still change it?
14. Is there anything someone must not be able to see?
15. Is there a step that needs a second person to agree before it goes through?

The assistant pre-fills a record × operation × actor matrix from the actor roles, then asks only about the cells where a sensible default is risky: **every delete cell, every update after a state change, and every cross-actor read.** It does not ask four questions per record per actor. Conditions too long for a table cell become `rules/<rule>.md`.

Question 13 is answerable here and not earlier because section 4 produced the states ("once it is approved") that the question depends on. That is why rules follow the flow rather than the records.

### Section 6 — Checks  → step checks in `flows/`, conditions in `rules/`

16. What has to be true before a <flow> can go forward? What would make you reject one?
17. What must never happen, even if someone asks for it?

### Section 7 — Failure  → `failures.md`

18. When a <flow> fails a check, what should happen to it — who sees it, and where does it wait?
19. What goes wrong today that you would want this to catch?

### Section 8 — Exceptions  → `exceptions.md`

20. What do people ask for that the normal process does not allow? How is it handled now?
21. Who is allowed to make that exception, and should there be a record of it?

This maps onto the planned AI role the site describes under business exceptions, and it is also ordinary good requirements practice, which is the test every section has to pass.

### Section 9 — Evidence  → `evidence.md`

22. If someone asked six months later why a <flow> turned out the way it did, what would you need to be able to show them?
23. Is there anything you are required to keep, or required to delete?

### Section 10 — Today  → `today.md`

24. How is this done today?
25. What must it keep working with — anything it has to read from or write to?
26. Is there anything already written down — a spreadsheet, a form, a procedure — that I should read? (If given a path, the assistant reads it and drafts from it.)

### Section 11 — Close  → `README.md`

27. What would make you say this is working?

The assistant then refreshes `README.md`, prints the readiness checklist, and offers to `git init` and make the first commit.

### Order and sittings

Easy first, then nouns, then one concrete story, then rules derived from the nouns and actors, then failure, exception, evidence, current state, close. People are good at telling a story and bad at filling in a matrix, so the story comes first and fills the matrix in.

- **Sitting 1** — sections 1–4, about fifteen minutes. Reaches *Sketch*.
- **Sitting 2** — sections 5–7. Reaches *Describable*.
- **Sitting 3** — sections 8–11. Reaches *Buildable* if the answers are there.

Every answer is written to disk as it is given. The skill is re-enterable at any point and reads `.describe-my-system/progress.json` to find where it stopped. Stopping early must leave something worth keeping; the design is judged on that more than on completion rates.

---

## What it writes to disk

Files are created lazily — only as their section is answered. A folder that stops after sitting 1 contains four of these and no empty stubs.

```
<system-name>/
  README.md                  what this folder is, how to use it, readiness
  system.md                  purpose, scope, what it will not do
  actors/<actor>.md          one per person-role or connected system
  records/<record>.md        one per thing the system keeps track of
  flows/<flow>.md            narrative, ordered steps, each step's contract and checks
  rules/permissions.md       the create/read/update/delete matrix
  rules/<rule>.md            conditions too long for a table cell
  failures.md                failed checks, error routes, who sees them
  exceptions.md              what falls outside the process, and who may allow it
  evidence.md                what must be shown later, kept, or deleted
  today.md                   current process and what it must keep working with
  open-questions.md          everything deferred, who can answer it, what it blocks
  .describe-my-system/
    progress.json            sections answered; drives resumability
    version.json             skill version and schema version
```

### File shape

One file, two audiences. The frontmatter is machine-readable; the body is what a person reads.

```markdown
---
schema: dms/1
kind: record
name: Order
aka: [job, ticket]              # the user's own words, kept
status: confirmed
fields:
  - name: customer
    kind: reference
    to: Customer
    required: true
    status: confirmed
  - name: promised_date
    kind: date
    required: false
    status: drafted             # assistant guessed; user has not confirmed
owner_actor: sales-clerk
retention: 7 years
---

# Order

What the sales clerk raises when a customer asks for work. ...
```

`status` at both file and field level is the integrity mechanism of the whole design. It is what lets a reader six months later tell the difference between what the business said and what an assistant filled in.

`rules/permissions.md` holds a single table — record down the side, create/read/update/delete across — because the value is in seeing it all at once and the blank cells are the point.

### Why Markdown with frontmatter rather than JSON or prose

Prose alone cannot be converted later. JSON alone is not readable by the person who has to correct it, and correcting it is most of the work. Markdown with frontmatter is diffable, is what the folder's other audience — a coding assistant — reads best, and renders on GitHub if the user commits it. The frontmatter keys are the conversion surface, so an exporter can be written years later without asking anyone to rewrite a folder.

---

## Distribution and install

### Why a separate repo

`shawnklewis/crudandlogic-skills`, new and public. Three reasons:

- `npx skills add` and the plugin marketplaces install from a repository root. The install command and the repo URL are user-facing, and pointing them at a website repo looks wrong.
- The skill has its own version and release cycle. Bundled into this repo, its version would move every time a paragraph on the site changes.
- A reader is being asked to install it. A repo whose whole contents are the thing they are installing is inspectable in a way a website repo is not.

The site links to it; the skill's `homepage` points back at the site. Naming follows `cloudflare/skills`, so the repo can hold sibling skills later without a rename.

### Layout

Follows agent-plugins.org 1.0.0, with the per-client directories the Cloudflare plugin uses:

```
plugin.json                        agent-plugins 1.0.0 manifest
mcp.json                           omitted in v1 — nothing to serve
skills/describe-my-system/
  SKILL.md                         name, description, the interview procedure
  references/
    question-bank.md               the 27 questions, verbatim, with the drafting rules
    file-formats.md                frontmatter schema dms/1
    vocabulary.md                  Actor / Document / Page / Worker / Pipeline mapping
    worked-example.md              one complete small folder
  templates/                       exact headings and keys, copied not composed
.claude-plugin/plugin.json
.claude-plugin/marketplace.json
.codex-plugin/plugin.json
.cursor-plugin/plugin.json
README.md  LICENSE  icon.png
```

`SKILL.md` carries the procedure and the three delivery rules; the question bank and schema live in `references/` so they load only when the interview is actually running.

**No `mcp.json`.** The Cloudflare plugin carries one because it has a hosted MCP server. This has nothing to serve. Adding one is how the runtime would connect to these folders later, if it ever does, and shipping an empty one now would imply a service exists.

### Assistants

| Assistant | Install |
|---|---|
| Claude Code | `/plugin marketplace add shawnklewis/crudandlogic-skills` then `/plugin install crud-and-logic@crud-and-logic` |
| Codex | `codex plugin marketplace add shawnklewis/crudandlogic-skills` then `codex plugin add crud-and-logic@crud-and-logic` |
| Cursor | Settings → Rules → Remote Rule (GitHub), `shawnklewis/crudandlogic-skills` |
| VS Code / Copilot | Enable `chat.plugins.enabled`, then *Chat: Install Plugin From Source* |
| Any Agent Skills agent | `npx skills add https://github.com/shawnklewis/crudandlogic-skills` |
| claude.ai web / desktop | Download the skill as a zip from the release and upload it |
| No skills support at all | Copy a single paste-in prompt from the site |

The last two rows are not an afterthought; see the first flag below.

---

## How a user knows they are finished

No percentage. A percentage invites gaming and implies the description is complete when it is only populated. Three named levels, and the skill prints which one the folder has reached along with exactly what is missing from the next:

- **Sketch** — `system.md`, at least one actor, at least one record. Enough to talk about with someone.
- **Describable** — one flow with steps end to end, a permissions matrix with no blank row for any record that flow touches, failures named. **This is the level to aim for**; the skill says so, and congratulates reaching it rather than reaching the end.
- **Buildable** — every flow named has steps, every rule has a decided owner, and `open-questions.md` has nothing marked `blocks-build`.

The checklist is available on request at any time, and is printed at the end of every sitting. "Finished" is explicitly not a state: the folder is meant to be corrected when the business changes.

## What they do with the folder

Named in `README.md`, in this order, because the first two are what make the folder worth filling in whether or not the runtime ever exists:

1. **Hand it to a coding assistant.** "Build me a prototype from this folder." The folder is a brief, and that is its immediate payoff. The skill offers this at the end of the last sitting.
2. **Hand it to a developer or a vendor.** It reads as a requirements document, and the permissions matrix is the part an estimate usually misses.
3. **Commit it.** The skill offers `git init` and a first commit. It is designed to be a repo: small files, meaningful diffs, so a change to a rule shows up as a change to a rule.
4. **Correct it when the business changes.** The `status` fields make it obvious what was never confirmed in the first place.
5. **Bring it to CRUD and Logic**, if and when there is something to bring it to. Last on the list deliberately.

---

## Left open, with a recommendation

| Question | Recommendation |
|---|---|
| Exporter to the business-description or Document format | **Defer.** The language has no syntax yet. `schema: dms/1` keeps the path open; write the exporter when there is an interpreter to export to |
| A sibling skill that builds a prototype from the folder | **Yes, after v1 ships.** It is the strongest proof that the folder has value without the runtime. Keeping it separate keeps the interview honest about not being a build tool |
| A hosted web version of the interview | **Do not build it yet.** It removes the install barrier (flag 1) but costs real work and a running service. Build it only if the skill shows uptake |
| A `check` mode that validates a folder's consistency | **Not in v1.** Worth adding once real folders exist to validate against; guessing the rules now would be designing for imagined mistakes |
| Telemetry on completion rates | **None.** It would be the only part of this that takes something from the user, and the folder is on their disk where it belongs |

---

## What will not survive contact with real users

Listed most likely first. These are design problems, not caveats.

**1. The audience does not use a terminal.** The site is written for IT professionals who use app builders but do not develop software. `npx skills add` and `/plugin marketplace add` assume a developer's machine and a developer's habits. This is the single biggest risk to the whole plan, and it is a distribution problem that no amount of interview design fixes. The zip-for-claude.ai row and the paste-in-prompt fallback are the mitigations, and the paste version must be genuinely complete rather than a teaser — a long prompt the user pastes into whatever assistant they have, which asks the same questions and tells them to save the answers themselves. It will produce messier folders. Messier folders from people who actually finish beat clean folders from nobody.

**2. Nobody finishes a 27-question interview.** Real people stop at ten minutes. The sitting structure and the lazy file creation are built for that, and the *Describable* level is positioned as the target precisely so that stopping is a success rather than an abandonment. Still expect most folders to stop after sitting 1. The design should be judged on whether a sitting-1 folder is worth having, which is also the honest test of whether the whole idea works.

**3. The permissions matrix is the best output and the most tedious to produce.** Users will go blank on "who is allowed to delete a job?" because they have never had to say. Drafting from actor roles and asking only about the risky cells is the mitigation, and it is a real improvement, but a drafted matrix the user skims and approves without thinking is a confident-looking fiction. Expect this, and resist the urge to make approval too easy.

**4. The assistant will invent fields and rules.** Helpfulness is the failure mode. The `status: drafted` marker is the mitigation and it only works if `SKILL.md` is unambiguous that `confirmed` requires an explicit yes. This is the correctness requirement of the entire design: a folder of plausible invented business rules is actively harmful, because it will be read later as a record of what the business said.

**5. Output will not be consistent across users.** Different assistants and different models will run the interview differently. Templates with exact headings and frontmatter keys, copied rather than composed, narrow the variance. They will not close it. Any future exporter has to tolerate ragged input, which is another argument for writing it later against real folders rather than now against an imagined ideal.

**6. Users will describe screens, not businesses.** "I need a dashboard with a grid of open jobs." The deflection rule handles the common case, but a user who only thinks in screens will find the whole interview frustrating, and some will leave.

**7. Users will paste real data into these files and then commit them publicly.** Customer names, prices, staff names, sometimes worse. The skill must warn once, at the point it first writes a record file, and should ask for example values rather than real records. This needs to be in `SKILL.md` and not only in the README nobody reads.

**8. The payoff is still deferred, and the folder's value as a build brief is unproven.** It is a reasonable claim, not a demonstrated one. Until the sibling build skill exists, "hand it to a coding assistant" is something we are asking people to take on trust. The honest framing on the site is the folder's immediate uses, with CRUD and Logic last — which is how `README.md` is ordered above, and the site copy should match.

**9. "Describe my system" is a generic name and may not trigger reliably.** The skill's `description` has to carry the words users actually say — "plan an app", "write requirements", "scope a system", "spec out a tool" — rather than the project's own vocabulary. This is cheap to get wrong and cheap to fix.
