# CAT VARC Practice

A static practice site for CAT Verbal Ability & Reading Comprehension. No sign-up, no backend; progress is stored in your browser.

**Live:** https://sujithsuresh-803.github.io/cat-varc-practice/

## What's inside
- **1,075 questions** across 7 topics: Reading Comprehension (35 passages, 175 Qs), Para Jumbles, Para Summary, Odd Sentence Out, Para Completion, Vocabulary, Grammar
- Questions are tagged Easy / Medium / Hard (725 from the VARC prep docs + 350 new CAT medium/hard questions)

## Features
- Pick the topics you want to practise for the day; RC is the priority topic
- **Quick 5**: five full RC passages with all their questions (CAT-style), 1 Easy · 2 Medium · 2 Hard or 2 Easy · 2 Medium · 1 Hard passages; ticking other topics adds 5 questions from them in the same mix
- **Custom set**: difficulty (mixed/easy/medium/hard), size, RC priority (~60% of the set), full RC passages
- Timer with pause (hides questions), save & exit, resume later
- CAT-style palette, mark for review, TITA input for Para Jumbles / Odd Sentence Out
- Answers revealed only after you submit the whole set
- Detailed report: CAT score (+3 / −1, no negative for TITA), accuracy and time by topic and difficulty, insights, full explanations, retry wrong questions
- Reports page with all-time stats and a daily log; export progress as JSON

Keyboard: `A`–`E` select an option, `←`/`→` navigate, `P` pause.

## Rebuilding the question bank
```
python tools/parse_docs.py <folder with VARC_0x_*.txt extracts> data/base.json
python tools/build.py
```
`build.py` merges `data/base.json` with `data/new_*.json` into `data/questions.js`.
