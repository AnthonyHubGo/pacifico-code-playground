# Pacífico Code Playground

A block-based coding module (built with [Blockly](https://developers.google.com/blockly)) that teaches kids to program using music, set in the context of Pacific Colombian music culture — instruments, rhythms, and regional identity, instead of the generic "turtle graphics" most coding-for-kids tools use.

This was my **undergraduate thesis project (proyecto de grado)** in Systems Engineering, built as one module inside **Eduverso**, a social-impact educational platform developed collaboratively with a small team.

## What it does

- Kids assemble music using code blocks (loops, conditionals, functions, sound blocks) instead of typing syntax
- Each block generates real code under the hood, teaching programming logic through a musical, culturally-grounded interface
- A level system with region-based progression (`RegionCard`, `ProgramacionMusicalLevelsPage`) tracks what a student has completed
- User progress is persisted per level via a backend API

## My contribution

This repository is a **curated snapshot** of the module I personally designed and built, extracted from Eduverso's private team repository for portfolio purposes — it is not the full commit history (that stays in the team repo, since Eduverso includes other modules built by teammates that aren't mine to publish). What's here is specifically my code:

- **Backend** (`backend/src/controllers/MusicLogic`, `backend/src/routes/musicRoutes.js`): API endpoints for level progress tracking, initialization, and the levels map per user
- **Blockly integration** (`frontend/src/pages/ProgramacionMusical/PacificoCodeBlocklyPlayground.jsx`): the block-based editor itself, including custom code generators for loops, conditionals, functions, and sound blocks
- **Code validation** (`frontend/src/utils/validateMusicCode.js`): rules that check whether a student's block program satisfies a given level
- **State management** (`frontend/src/redux/slices/musicSlice.js`): Redux slice for level and progress state
- **Supporting UI** (`frontend/src/components/ProgramacionMusical`, level/region pages): level buttons and region selection cards

## Stack

- **Frontend:** React, Redux Toolkit, Blockly, SCSS
- **Backend:** Node.js, Express
- **Auth:** JWT-based, via a shared auth middleware (not included in this extract)

## Context

Eduverso is a social-impact project built by a small team; this module was my specific area of ownership and the subject of my degree thesis. Shared publicly with my team's agreement, as a portfolio sample — not an actively maintained standalone project.
