# AI Workplace Productivity Assistant

A modern, responsive web app that helps professionals automate everyday workplace tasks with AI: drafting emails, summarizing meetings, planning the week and getting quick answers in one clean dashboard.

**Live app:** https://workday-wingmate-ai.lovable.app
**Repository:** https://github.com/moletsanefortunate1/ai-workplace-navigator
**Built for:** AI Acceleration Skills Programme, Week 23 project

---

## Project overview

Office work is full of small, repetitive jobs: writing the same kinds of emails, turning messy meeting notes into action lists, and deciding what to do first. These jobs eat time that could go to work that matters.

The AI Workplace Productivity Assistant puts four AI tools in one place, behind a simple sign-in, so a professional can get a solid first draft in seconds and then edit it to suit them. The app is designed so the person stays in control: every AI result is editable and clearly marked as AI-generated.

## Features

1. **Smart Email Generator**: enter the recipient, purpose and key points, choose a tone (formal, friendly or persuasive), and get a professional email draft.
2. **Meeting Notes Summarizer**: paste raw notes and get a summary, action items, decisions and deadlines.
3. **AI Task Planner**: enter your tasks and get a prioritized daily or weekly schedule.
4. **AI Chat Interface**: chat with an AI assistant. Conversations are saved, and you can switch between them, start new ones or delete them.

**Across the app**
- Dashboard layout with sidebar navigation
- Responsive design for mobile and desktop
- Clear input and output sections on every tool
- Editable AI outputs, with copy buttons
- Loading states and friendly error messages
- Sign-in, with chat history and recent activity saved per user
- Responsible AI disclaimer in the footer and under every AI result

## Responsible AI

- **Disclaimer:** every AI result carries the notice "AI-generated content may contain errors. Review before using."
- **Human in control:** all outputs are editable, so the user reviews and changes anything before using it.
- **Privacy:** each user's saved chats and activity are tied to their own account. Users should avoid entering passwords, ID numbers or confidential company information.
- **Limitations:** AI models can be wrong, out of date or biased, so results should be treated as drafts, not final answers.

## Tools used

- **Lovable AI**: used to generate and iterate on the application from prompts
- **GitHub**: version control, with Lovable syncing changes automatically
- **TanStack Start, React and TypeScript**: application framework
- **Vite**: build tooling
- **Tailwind CSS and shadcn/ui components**: styling and interface components
- **Vercel AI SDK (`ai` package)**: connects the chat to the AI model
- **Supabase (via Lovable Cloud)**: sign-in and database for saved chats and recent activity
- **Motion**: loading animations

## Setup instructions

**Requirements:** Node.js or Bun, and Git.

1. Clone the repository:
   ```bash
   git clone https://github.com/moletsanefortunate1/ai-workplace-navigator.git
   cd ai-workplace-navigator
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
   (or `npm install`)
3. Environment variables: the project includes a `.env` file with the Supabase project ID, URL and publishable key it needs to connect to its backend.
4. Start the development server:
   ```bash
   bun run dev
   ```
   (or `npm run dev`), then open the local address shown in the terminal.

The backend (database, sign-in and AI features) is hosted through Lovable Cloud, so the app is easiest to try through the live link above.

## Team members

- **Fortunate Moletsane**: sole developer (design, prompts, building, testing and deployment)

## Future improvements

- Save and reopen past emails, meeting summaries and plans
- Export meeting notes and schedules as PDF
- Turn meeting action items directly into planner tasks
- Show a friendlier display name instead of the email prefix on the dashboard
