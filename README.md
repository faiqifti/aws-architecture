# CloudQuest — AWS Solutions Architect Associate Learning Journey

A local-first, gamified study companion for the **AWS Certified Solutions Architect – Associate (SAA-C03)** exam. It runs entirely in the browser: no backend, no accounts, no API keys, no network requests for the learning experience.

> **Independent study material.** CloudQuest is not official AWS training and is not affiliated with or endorsed by AWS. All questions, scenarios and explanations are original. They are **not** actual exam questions. Practice and mock-exam percentages are **not** AWS scaled scores and do not predict a certification result.

## Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Level, XP, streak, accuracy, completion, exam-readiness indicator, daily missions, per-domain performance (weakest domain highlighted), recent modules and quizzes, recommended next steps, quick actions, empty states for new users. |
| **Learning Path** | 19 modules across the four SAA-C03 domains: objectives, explanations, architecture diagrams, key services, common exam traps, a knowledge-check quiz and a completion record. |
| **Practice Lab** | Quiz engine with domain, difficulty and length filters, randomised questions and options, single- and multiple-answer questions ("Select 2"), explanations (including why each distractor is wrong) after submitting, flag-as-difficult, retry incorrect, final score and domain breakdown. |
| **Architecture Challenges** | Six scenarios. Pick components, make decisions, and get scored against availability, security, scalability, performance, cost and operational simplicity, with a detailed debrief. |
| **Exam Simulator** | Timed mock exam (default practice config or the real 65 questions / 130 minutes), question navigator, mark for review, countdown, auto-submit at zero, confirmation before ending, per-domain scores, review of missed questions, revision suggestions. A running exam survives a page refresh. |
| **Skill Tree** | Eight branches / 19 skills with status (Not started → Learning → Practiced → Proficient), accuracy, related modules and challenges, prerequisites. |
| **Achievements** | Seven achievements evaluated from saved data. |
| **Settings** | Daily question target, preferred session length, light/dark/system theme, reduce motion, export / import / reset progress. |

## Local setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to dist/
npm run preview    # serve the production build locally
npm test           # unit tests (Vitest)
```

## Deploy to Netlify

The project is a static Vite site; `netlify.toml` already configures everything.

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Netlify choose **Add new site → Import an existing project** and pick the repository.
3. Confirm the build settings (they are read from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy**. No environment variables are needed.

Alternatively, drag the built `dist/` folder onto Netlify Drop (the `_redirects` file in `public/` is copied into it), or use the CLI:

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

**Client-side routing:** the app uses React Router (`/learn/iam`, `/challenges/ha-web`, …). `netlify.toml` contains a `/* → /index.html` rewrite (status 200) and `public/_redirects` carries the same rule, so refreshing or opening a deep link never returns a 404. Verify after deploying by opening `https://<your-site>.netlify.app/learn/iam` directly.

## Where your progress lives

Progress is saved in your browser's **LocalStorage** (key `cloudquest:v1`). That means:

- It is **browser- and device-specific**. A different browser, profile or device starts empty.
- **Clearing site data, using a private window, or uninstalling the browser can erase it.**
- Use **Settings → Export progress** to download a JSON backup, and **Import progress** to restore it, including on another device. Imports are validated and sanitised before anything is replaced, and you must confirm.
- Only learning data is stored: no names, emails or identifiers.

## Gamification rules

All values live in `src/lib/progression/config.ts`.

| Action | Reward | Anti-farming rule |
| --- | --- | --- |
| Correct answer | 10 XP | First correct answer per question only. |
| Repeat correct answer | 2 XP | Capped at 20 XP per calendar day. |
| Complete a module | 50 XP | Once per module; requires 70% on its knowledge check. |
| Daily mission | 30 XP each | Once per mission per day; progress comes from recorded actions. |
| Architecture challenge | 100 XP | Once per challenge, on first score of 70+. |
| Mock exam (20+ questions) | 100 XP first time, then 25 XP | Later exams only pay when they beat your best score. |

Levels use cumulative thresholds `50·n·(n−1)` XP (L2 = 100, L3 = 300, L4 = 600, …). Streaks count consecutive **local** calendar days with qualifying activity; moving time zones never reduces a streak. Skills only reach *Proficient* after a completed module plus 8+ answers across 3+ distinct questions at 80%+ accuracy.

## Project structure

```
src/
  app/                 App shell, router
  components/          layout, ui, charts
  features/            dashboard, learning-path, practice, challenges,
                       exam-simulator, skill-tree, achievements, settings
  data/                questions/, modules/, challenges/, skills, domains (bundled content)
  hooks/               useProgress (state + persistence provider)
  lib/
    progression/       XP, levels, missions, achievements, skills, recommendations (pure logic)
    scoring/           answer checking, exam evaluation/building, readiness, challenge scoring
    streaks/           local-date streak logic
    storage/           schema, migration, localStorage, import/export
    validation/        input guards
  types/               shared TypeScript types
  styles/              Tailwind entry + theme tokens
```

Business rules are pure functions (`state, input → state, events`) and are unit-tested; UI components only call them.

## Extending the content

- **Questions:** add `q(...)` entries in `src/data/questions/<domain>.ts`. IDs must be unique and stable (progress is keyed by ID). Tests check answer keys and ID uniqueness.
- **Modules:** add to `src/data/modules/` and add a matching skill in `src/data/skills.ts` (same `id`).
- **Challenges:** add to `src/data/challenges/index.ts`. Include a `reference` design; tests assert it scores 85+ and that "select everything" does not pass. The challenge UI is data-driven, so a drag-and-drop builder can later replace the checklist while reusing `evaluateChallenge`.

## Accessibility

Semantic landmarks, skip link, keyboard-operable controls, visible focus rings, native form controls for answers, `aria-live` regions for timers and results, text labels alongside colour, dark mode with AA-contrast tokens, and reduced-motion support (OS setting or Settings toggle).

## License

Educational project. AWS and service names are trademarks of Amazon.com, Inc. or its affiliates.
