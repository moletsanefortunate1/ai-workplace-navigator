# AI Workplace Navigator

Build a modern, responsive web application called AI Workplace Productivity Assistant for professionals who want to automate everyday workplace tasks.

Layout: Dashboard with a collapsible left sidebar (Dashboard, Email Generator, Meeting Notes, Task Planner, AI Chat). On mobile, the sidebar becomes a hamburger menu.

Dashboard page: Hero section with a short welcome message, quick-access cards for each tool, and a small “recent activity” area.

Smart Email Generator: Inputs: recipient, purpose, key points, tone (formal / friendly / persuasive). Output: subject line plus email body in an editable text area, with Copy and Regenerate buttons.

Meeting Notes Summarizer: Input: a large text area for raw notes. Output: three clearly separated sections: Summary, Action Items (with owner), Decisions and Deadlines.

AI Task Planner: Input: a list of tasks with deadlines and priority. Output: a prioritized daily or weekly schedule.

AI Chat: Chat interface with message history and a typing indicator.

Requirements: All AI outputs must be editable. Show loading states and friendly error messages. Include a visible Responsible AI disclaimer in the footer and on every output (“AI-generated content may contain errors. Review before using.”). Use a clean, modern, SaaS-style design with a dark theme, consistent spacing, and one accent colour.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0aa4a5e8-5a80-4731-b668-a62d9001c8b8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
