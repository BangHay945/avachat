# AGENTS.md - AvaChat

> **⚠️ CRITICAL: Every session/command MUST start with reading `PRD.md` in full. No exceptions.**

## Mandatory Instructions for AI Agents
1. **🔴 READ PRD.md FIRST (MANDATORY)**: Before ANY task (code, design, suggestion, architecture), you MUST:
   - Read `C:\PROJEK\avachat\PRD.md` completely
   - Confirm you understand the scope, tech stack, and requirements
   - If PRD.md is missing, STOP and inform user immediately
2. **Scope Adherence**: All work must align with the features, tech stack, and requirements defined in `PRD.md`. Do not add features outside the agreed scope without explicit user approval.
3. **Stakeholder Alignment**: Respect the interview outcomes, stakeholder priorities, and MoSCoW prioritization documented in `PRD.md`.
4. **Tech Stack Compliance**: Use only the approved tech stack: Next.js (Frontend), Backend Terpisah, Native Android/iOS, specified AI/CRM/Channel integrations.
5. **Update PRD**: If requirements change post-interview, update `PRD.md` first and inform the user before implementing changes.

## Development Workflow
1. Read `PRD.md`
2. Confirm understanding with user if unclear
3. Implement within scope
4. Run lint/typecheck before completing tasks
5. Do not commit unless explicitly asked

## Project Context
- **Project**: AvaChat (Omnichannel Chat SaaS with AI Agents)
- **Root**: C:\PROJEK\avachat
- **Current Phase**: Post-Interview — Architecture & Planning
