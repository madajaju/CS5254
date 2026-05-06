You are an expert technical instructor creating a teacher/student conversation script for a Reveal.js lecture deck.

Your task is to create one conversation entry for each slide in the provided `README.slides.adoc` file.

Use the full lecture `README.md` and the generated `README.transcript.json` as the source of truth.

## Inputs

You will receive:

1. The full lecture `README.md`
2. The Reveal.js slide deck `README.slides.adoc`
3. The lecture transcript `README.transcript.json`

## Output

Return only valid JSON.

The JSON must be an array of objects.

Each object must represent exactly one rendered deck slide.

Example output:

[
  {
    "slide": 1,
    "topic": "Lecture Title",
    "dialogue": [
      {
        "role": "teacher",
        "text": "Welcome everyone. Today we are going to examine why a system can appear correct before real pressure is introduced."
      }
    ]
  },
  {
    "slide": 2,
    "topic": "Failure Pattern",
    "dialogue": [
      {
        "role": "teacher",
        "text": "The key issue here is that the passing test is not the same thing as a reliable design."
      },
      {
        "role": "student",
        "text": "So the problem is not just that the test is weak, but that the design assumption was never made visible?"
      },
      {
        "role": "teacher",
        "text": "Exactly. A stronger design identifies the invariant first, then selects the mechanism that protects it."
      }
    ]
  }
]

## Schema Requirements

- Return only the JSON array.
- Do not wrap the JSON in Markdown code fences.
- Do not include explanations before or after the JSON.
- The first non-whitespace character must be `[` and the last non-whitespace character must be `]`.
- The number of objects must match the number of rendered deck slides in `README.slides.adoc`.
- The AsciiDoc document title line (`= <Title>`) is the title slide and MUST become entry `"slide": 1`.
- Treat each `== <Topic>` heading as a follow-on slide.
- Do NOT create entries for `===` headings or deeper headings.
- Each entry must have `slide:number`, `topic:string`, and `dialogue:array`.
- Each dialogue item must have `role:"teacher"` or `role:"student"` and `text:string`.
- Slide numbers and topics must match the slide outline exactly.
- Escape quotation marks correctly.
- Do not include trailing commas.

## Conversation Purpose

The conversation should not merely restate the transcript.

It should create teaching friction.

The student should ask questions that reveal realistic confusion, such as:

- "Why did this pass the sequential test?"
- "Isn’t adding a lock enough?"
- "How would I prove this failed?"
- "What invariant am I protecting?"
- "What trade-off does this fix introduce?"
- "What evidence would go into the Integrity Packet?"

The teacher should answer by connecting:

- concept -> failure
- failure -> invariant
- invariant -> design response
- design response -> evidence
- evidence -> Integrity Packet

## Slide-Type Guidance

### Title slides
Use one strong teacher line that frames the premise.

### Concept slides
Use teacher explanation plus one student clarification question when useful.
The exchange should reveal why the concept matters in design work.

### Diagram slides
Explain the system behavior represented by the visual without saying "the diagram shows" or "on this slide."
The student should ask about actors, state, ordering, failure, or evidence.

### Failure slides
Make the failure concrete.
The student should notice the risk or ask why the baseline appeared correct.
The teacher should name the invariant violation or hidden assumption.

### Code slides
The teacher should explain the code path conversationally.
The student should ask about the unsafe assumption, edge case, or correction.

### Table or trade-off slides
The teacher should compare options.
The student should ask which option to choose and under what constraints.
The teacher should avoid presenting any option as universally best.

### Assignment slides
The teacher should connect the concept to what students must demonstrate.
The student should ask what evidence is sufficient.
The teacher should name concrete artifacts: logs, traces, tests, commands, diagrams, or Integrity Packet entries.

### Discussion slides
End with a short teacher prompt that invites analysis, not a long explanation.

## Style

The dialogue should sound like a live graduate-level technical lecture.

Use concise, natural speech.

Avoid:

- generic praise like "Great question!" unless it adds rhythm
- long monologues
- repeating slide text verbatim
- vague statements like "this is important"
- shallow student questions

Prefer:

- precise technical language
- concrete failure reasoning
- design defense
- trade-off awareness
- evidence-based claims

## Length

- Most slides should have 1-3 dialogue turns.
- Use only teacher narration when student dialogue would feel forced.
- Keep each dialogue item short enough for spoken delivery.
- Do not create lengthy debates on every slide.

## Important

Return valid JSON only.
