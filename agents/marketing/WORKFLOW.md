# Marketing Agent Workflow — AI Mortgage Adviser

## Agent Team (SAFe-inspired)

Inspired by [SAFe Agentic Workflow](https://github.com/bybren-llc/safe-agentic-workflow).

| Agent | Role | SAFe Equivalent |
|-------|------|-----------------|
| **Campaign Strategist** | Plans campaigns, sets KPIs, allocates budget | BSA (Business Systems Analyst) |
| **Content Creator** | Writes blog posts, social copy, ad creatives | FE Developer |
| **Video Producer** | Creates video scripts, storyboards, shot lists | BE Developer |
| **SEO Analyst** | Keywords, on-page optimisation, link building | Data Engineer |
| **Social Media Manager** | Platform management, engagement, scheduling | FE Developer |
| **Email Automation** | Email sequences, nurture flows, deliverability | BE Developer |
| **Ads Manager** | Paid campaigns across Google, Meta, LinkedIn, TikTok | System Architect |
| **Analytics Reviewer** | QA, compliance, performance tracking, reporting | QAS (Quality Assurance) |

## Workflow: New Campaign Launch

```
1. STRATEGIST → Creates campaign brief
   ├── Objective, segment, budget, timeline, KPIs
   └── Output: Campaign Brief document

2. SEO ANALYST → Keyword research + competitor analysis
   ├── Target keywords, content gaps, competitor positioning
   └── Output: Keyword map + SEO brief

3. PARALLEL EXECUTION:
   ├── CONTENT CREATOR → Blog posts, social copy, ad creatives
   ├── VIDEO PRODUCER → Video scripts + storyboards
   ├── EMAIL AUTOMATION → Email sequences for campaign
   └── ADS MANAGER → Campaign setup + ad copy + audiences

4. ANALYTICS REVIEWER → Pre-launch QA
   ├── Compliance check (FCA disclaimers)
   ├── Brand consistency check
   ├── Technical check (UTMs, pixels, links)
   └── Output: Approved or changes required

5. SOCIAL MEDIA MANAGER → Schedule and publish
   ├── Content calendar populated
   ├── Posts scheduled across platforms
   └── Engagement plan activated

6. ADS MANAGER → Launch paid campaigns
   ├── Campaigns activated
   ├── Budget allocation confirmed
   └── Monitoring dashboards set up

7. ANALYTICS REVIEWER → Weekly performance review
   ├── KPI tracking
   ├── Optimisation recommendations
   └── Output: Weekly report
```

## Workflow: Rate Change Response (urgent)

```
1. STRATEGIST → Rate change brief (1 hour turnaround)
2. PARALLEL:
   ├── CONTENT CREATOR → Social posts + blog update
   ├── EMAIL AUTOMATION → Rate alert sequence triggered
   ├── VIDEO PRODUCER → 60-second rate update script
   └── ADS MANAGER → Update ad copy with new rates
3. SOCIAL MEDIA MANAGER → Publish immediately
4. ANALYTICS REVIEWER → Track response metrics
```

## Workflow: Monthly Content Cycle

```
Week 1: CONTENT CREATOR → Educational blog + tip posts
Week 2: VIDEO PRODUCER → Tutorial or case study video
Week 3: CONTENT CREATOR → Market analysis + rate content
Week 4: ANALYTICS REVIEWER → Monthly report + next month planning
Ongoing: SOCIAL MEDIA MANAGER → Daily engagement
Ongoing: ADS MANAGER → Campaign optimisation
Ongoing: SEO ANALYST → Keyword tracking + link building
```

## Quality Gates (mandatory before launch)

1. **Brand Gate** — Content Creator confirms brand voice consistency
2. **Compliance Gate** — Analytics Reviewer confirms FCA disclaimers present
3. **Technical Gate** — Analytics Reviewer confirms tracking + links working
4. **Budget Gate** — Strategist confirms budget allocation approved
5. **Human Gate** — Product owner gives final approval for campaigns >£1,000

## Agent Communication Protocol

Each agent produces a structured output that feeds into the next:

```
---
Agent: [AGENT NAME]
Task: [TASK DESCRIPTION]
Status: [DRAFT | READY FOR REVIEW | APPROVED | NEEDS CHANGES]
Dependencies: [WHAT THIS NEEDS FROM OTHER AGENTS]
Output: [DELIVERABLE DESCRIPTION]
Next: [WHICH AGENT TAKES THIS NEXT]
---
```

## Getting Started

1. Start with the **Campaign Strategist** — define your first campaign
2. Feed the brief to **SEO Analyst** for keyword research
3. Distribute to **Content Creator**, **Video Producer**, and **Ads Manager** in parallel
4. **Analytics Reviewer** validates everything before launch
5. **Social Media Manager** publishes and manages engagement
6. **Analytics Reviewer** reports weekly on performance
