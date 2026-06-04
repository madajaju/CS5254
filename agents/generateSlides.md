[FULL SLIDE PROMPT]

You are converting extended lecture notes into a Reveal.js slide deck.

The user will provide the full contents of a `README.md` lecture file.

Your task is to create:

`README.slides.adoc`

using **AsciiDoc + Reveal.js** format.

---

# Goal

Transform the lecture into a **visual teaching system** that supports a **real classroom-style lecture**.

The slides must:

* reinforce spoken explanation
* highlight key ideas
* visualize concepts and failure modes
* NOT act as a script or narration

The slides should feel like:
→ visual anchors for a live lecture, not a standalone presentation

---

# Output Rules

Return ONLY the contents of `README.slides.adoc`.

Do NOT explain anything.

Do NOT use markdown fences.

---

# Reveal.js Header

Start with:

= Lecture Title
Dr. Darren Pulsipher
:revealjs_theme: white
:revealjs_slideNumber: true
:revealjs_hash: true
:revealjs_width: 1280
:revealjs_height: 720
:revealjs_transition: fade
:customcss: custom.css
:source-highlighter: highlight.js
:icons: font
:stem:


Heading rules are mandatory:

* Use exactly one document title line: `= Lecture Title`
* That document title is the deck title slide.
* Use `== Slide Title` for every follow-on slide.
* Do NOT use `===` headings anywhere.
* Do NOT use heading levels deeper than `==`.
* If content needs subsections, use bullets, tables, labeled lists, or separate `==` slides instead of `===`.
* The first `==` heading must be the first content slide after the title slide.
* Multi-layered unordered lists MUST use AsciiDoc depth markers: `*` for the first layer, `**` for the second layer, and `***` for the third layer only if absolutely necessary.
* Nested list markers MUST begin at column 1. Do NOT indent nested bullets with spaces.
* Do NOT use Markdown-style nested bullets such as two spaces followed by `-`.
* Do not have more than 6 bullets or sub-bullets per page.
* Do not put plantuml and text on the same slide.
* Validator hard rule: no more than 6 top-level bullets on any text slide.
* Validator hard rule: no more than 8 total bullet lines on any text slide, including nested bullets.
* Validator hard rule: do not combine PlantUML with bullets, tables, source blocks, columns, or prose.
* Validator hard rule: do not combine code blocks or tables with bullets.

---

# Core Slide Principle (CRITICAL)

Slides are NOT the lecture.

Slides support the lecture.

Therefore:

* do NOT explain everything on the slide
* do NOT write paragraphs
* do NOT mirror narration

Instead:

* highlight key ideas
* show structure visually
* create cognitive anchors

---

# Slide Design Rules

Each slide must:

* have a short title (2–5 words)
* contain minimal text (≤ 80 words total)
* use ≤ 8 bullets or sub-bullets
* prefer plantuml diagrams over text
* hard limit: no more than 80 words total
* hard limit: no more than 6 top-level bullets
* hard limit: no more than 8 bullet lines total, including nested bullets
* hard limit: no mixed layout slides

Avoid:

* dense explanations
* long sentences
* lecture-style prose

---

# Slide Layout Budget (CRITICAL)

Every slide must use exactly one primary layout:

1. Text-only slide
2. Diagram-only slide
3. Table-only slide
4. Code-only slide
5. Two-column comparison slide

Do NOT combine major layout types.

Rules:

* A PlantUML slide may contain only the slide title and the PlantUML block.
* A table slide may contain only the slide title and the table.
* A code slide may contain only the slide title and one source block.
* A text-only slide may contain bullets, but no PlantUML, table, or code block.
* If a slide needs both explanation and a diagram, split it into two slides:
** one text slide for the idea
** one diagram slide for the visual model
* If a slide needs more than 4 top-level bullets, split it into multiple slides.
* If a nested list creates more than 6 total bullet lines, split it into multiple slides.
* Prefer two short slides over one crowded slide.
* Before returning, self-check every slide against the one-layout rule. If any slide mixes PlantUML, table, code, columns, or bullets, split it before returning.

---

# Columns

Use columns sparingly.

Columns are allowed only for direct comparisons, such as:

* before vs after
* risk vs response
* symptom vs cause
* option A vs option B

Column rules:

* Use exactly 2 columns.
* Do NOT put PlantUML diagrams in columns.
* Do NOT put code blocks in columns.
* Each column may have a short heading plus up to 3 bullets.
* Total slide content across both columns must still fit within 35 words.
* If either column needs nested bullets, do not use columns; split into separate slides.

Use this AsciiDoc structure:

[.columns]
--
[.column]
====
*Left heading*

* Short point
* Short point
====

[.column]
====
*Right heading*

* Short point
* Short point
====
--

---

# Teaching Alignment (MANDATORY)

Slides must align with how a real instructor teaches.

Each major concept should include:

1. Concept introduction
2. Concrete example
3. Failure or tension
4. Design response or pattern

If a concept includes risk or failure:
→ it MUST be visualized on a slide

---


---

# Visual Pairing Rule (MANDATORY)

Every major lecture idea MUST be expressed as a teaching pair:

1. A short concept slide that introduces the idea
2. A separate diagram-only PlantUML slide that visualizes the idea

Do not introduce a major concept without a visual companion.

A strong lecture deck should alternate between:

* idea
* visual model
* example
* failure
* correction
* evidence

At least 45-60% of the `==` slides MUST be diagram-only PlantUML slides. If fewer than 45% of the `==` slides are diagram-only PlantUML slides, the deck is incomplete.

This is not optional. Do not create a deck with only one or two diagrams.

Before returning, count:

* total `==` slides
* diagram-only PlantUML slides
* diagram ratio = diagram-only PlantUML slides / total `==` slides

If the ratio is below 45%, add or split concept slides until the ratio is at least 45%.

---

# Required Diagram Types

Use diagrams to teach system reasoning, not decoration.

For concurrency topics, include timeline or sequence diagrams showing overlapping execution.
For state topics, include state transition diagrams.
For workflow topics, include flow diagrams.
For failure topics, include failure path or invariant violation diagrams.
For correction topics, include before/after or risk/control diagrams.
For evidence topics, include claim/evidence/review flow diagrams.

Do NOT create only generic box-and-arrow diagrams. Use the diagram type that best matches the concept.

---

# Diagram Quality Bar

Each diagram must answer one of these questions:

* What actors interact?
* What state changes?
* What failure becomes possible?
* What invariant is violated?
* What control prevents or contains the failure?
* What evidence proves the design claim?

If a diagram does not teach one of those things, simplify or replace it.

# Required Failure Emphasis

At least 2 slides must show **failure scenarios**.

These should include:

* what breaks
* what users see
* what goes wrong under concurrency or AI misuse

Examples:

* race condition timeline
* inconsistent state flow
* system under load
* conflicting updates

Failure slides should feel:
→ concrete and slightly uncomfortable

---

# Required Visuals [TARGET]

Aim for 50% of `==` slides to be diagram-only PlantUML slides.

This is a strong generation target, not a reason to create bad slides.
If a table, code sample, or discussion question is clearly better for a slide, keep it.
But whenever a concept can be shown visually, prefer a separate PlantUML slide over another text slide.

Practical target:

* Create 22-32 `==` slides for a 15-minute lecture when the lecture has enough concepts.
* Use 10-16 diagram-only PlantUML slides when possible.
* Pair major text concepts with a separate diagram-only slide.
* Show each failure scenario as a diagram-only slide unless code is essential.
* If you create a concept slide, usually create the next slide as its diagram.
* If the deck has only one PlantUML diagram, the deck is invalid.

Use diagrams for:

* architecture
* flow
* failure timelines
* concurrency interactions
* decision logic

---

# PlantUML Rules

Must Use:

[plantuml, target=name, format=svg, width=100%]
----
@startuml
skinparam BackgroundColor #123456
skinparam DefaultFontColor black
skinparam ArrowColor white
skinparam ArrowFontColor #ffd166
skinparam ArrowFontStyle bold
skinparam ArrowFontSize 16
skinparam ActorBorderColor #123456
skinparam ActorFontColor white
skinparam participant {
  BackgroundColor white
  BorderColor #123456
  FontColor black
}
skinparam sequence {
  LifeLineBorderColor white
  LifeLineBackgroundColor white
  ParticipantBorderColor #123456
  ParticipantBackgroundColor white
  ParticipantFontColor black
}
skinparam rectangle {
  BackgroundColor white
  BorderColor #123456
  FontColor black
}
skinparam database {
  BackgroundColor white
  BorderColor #123456
  FontColor black
}
skinparam state {
  BackgroundColor white
  BorderColor #123456
  FontColor black
}
skinparam activity {
  BackgroundColor white
  BorderColor #123456
  FontColor black
}
skinparam note {
  BackgroundColor white
  BorderColor #123456
  FontColor black
}
skinparam shadowing false
skinparam linetype ortho
left to right direction

rectangle "Actor A" as A
rectangle "Shared state" as S
rectangle "Evidence log" as E

A --> S : contested write
S --> E : record transition
@enduml
----

Rules:

* 3–8 elements per diagram
* short labels
* clear arrows
* readable on 16:9
* use `width=100%` on every PlantUML block
* use `skinparam BackgroundColor #123456` so PlantUML images match the slide background
* use white `DefaultFontColor` and `ArrowColor` so text outside boxes and relationship lines are visible
* use `ArrowFontColor #ffd166`, `ArrowFontStyle bold`, and `ArrowFontSize 16` so relationship labels stand out
* use white shape backgrounds, black shape text, and `BorderColor #123456` for rectangle/database/state/activity/note boxes
* for sequence diagrams, include the `skinparam participant` and `skinparam sequence` blocks exactly as shown so participant boxes and lifelines have strong contrast
* when an arrow has a label, use a longer arrow such as `A --> B : label`; do NOT use short labeled arrows like `A -> B : label`
* use directional arrows such as `-right->` and `-down->` when that improves a 16:9 layout
* avoid unnecessary styling beyond the required readability settings above

---

# Visual Diversity

Use a mix of:

* concept slides
* diagram slides
* failure/tension slides
* code/example slides
* comparison/table slides
* discussion slide

---

# Table Requirement

Include at least one slide with a table comparing:

* approaches
* tradeoffs
* failure modes

Tables must use valid AsciiDoc table syntax, never Markdown table syntax.

Use this exact structure for a 4-column table:

[.stretch]
[cols="1,1,1,1", options="header", width="100%"]
|===
| Approach | Strength | Weakness | Use
| Baseline | Simple | Hides timing | First version
| Guarded | Protects invariant | Needs modeling | State changes
| Observed | Strong evidence | Adds logging | Design defense
|===

Table rules:

* Put `[.stretch]` immediately before the table attributes.
* Put `[cols="1,1,1,1", options="header", width="100%"]` immediately before `|===`.
* Open and close every table with `|===`.
* Do NOT use Markdown separator rows such as `|---|---|`.
* Do NOT use Markdown-style tables.
* Do NOT put bullets, PlantUML, source blocks, columns, or prose on a table slide.
* Keep table cells short so the table fills but still fits on 16:9.

---

# Code Slides

If code is included:

* ≤ 15 lines
* trimmed to essentials
* include 1–2 inline comments
* do not add bullets, prose, tables, or diagrams on the same slide
* use AsciiDoc source blocks:

[source,language]
----
code here
----

---

---

# Slide Flow (DEFAULT)

1. Title / premise
2. Why it matters
3. Core concept
4. Example
5. Visual model
6. Failure / tension
7. Pattern / solution
8. Tradeoffs
9. Assignment connection
10. Discussion

Adapt only if needed.

---

# Slide Fit Rules

Each slide must:

* fit cleanly in 16:9
* avoid clutter
* avoid tiny text

If content is too large:

* split slides
* simplify visuals
* move detail to speaker notes

---

# Discussion Slide

End with:

== Discussion

Include 1–2 strong questions.

Questions should focus on:

* failure
* design decisions
* tradeoffs
* AI usage

---

# Style Guidance

Slides should feel:

* visual
* structured
* slightly provocative
* engineering-focused

NOT:

* verbose
* academic
* corporate
* overly polished

---

# Final Check

Ensure:

* slides support spoken teaching
* slides do not replace narration
* visuals carry meaning
* failure scenarios are included
* pacing aligns with a 15-minute lecture
* 45-60% of `==` slides are diagram-only PlantUML slides
* every major concept that can benefit from a diagram has a separate diagram-only slide
* every slide uses exactly one primary layout
* no slide combines bullets with PlantUML, source blocks, or tables
* all nested bullets start at column 1
* no Markdown-style indented `-` bullets appear

---

# Output Rule

Return ONLY the completed `README.slides.adoc`.
