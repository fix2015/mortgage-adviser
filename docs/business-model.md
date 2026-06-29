# AI Mortgage Adviser — Business Model & Feature Brainstorm

*Last updated: 29 June 2026*

---

## Current Price Plans

| Plan | Price | Questions | Documents | Key Features |
|------|-------|-----------|-----------|-------------|
| **Free Trial** | £0 | 3 | 1 | Basic chat, no PDF |
| **Full Consultation** | £15 one-time | 50 | Unlimited | Full chat, PDF report, bank comparison, calculator |
| **Monthly Plan** | £7/month | 20/month | Unlimited | Recurring access |
| **Extra Questions** | £5 per pack | +50 | — | Add to existing |
| **Broker Review** | £75 one-time | — | — | Human broker reviews AI strategy |

---

## Cost Per User

### OpenAI (GPT-4o)
| Operation | Cost per call | Calls/user | Cost/user |
|-----------|--------------|------------|-----------|
| Chat Q&A (50 questions) | £0.012 | 50 | **£0.60** |
| Bank Comparison | £0.015 | 2 | £0.030 |
| Readiness Score | £0 (no AI) | — | £0 |
| Mortgage Calculator | £0 (no AI) | — | £0 |
| PDF Report + Summary | £0.020 | 1 | £0.020 |
| Doc Classification | £0.008 | 10 docs | £0.080 |
| **Total per user** | | | **£0.73** |

### Stripe Fees
| Plan | Revenue | Fee (1.4% + 20p) | Net |
|------|---------|-------------------|-----|
| Consultation £15 | £15.00 | £0.41 (2.7%) | **£14.59** |
| Monthly £7 | £7.00 | £0.30 (4.3%) | **£6.70** |
| Extra Questions £5 | £5.00 | £0.27 (5.4%) | **£4.73** |
| Broker Review £75 | £75.00 | £1.25 (1.7%) | **£73.75** |

### Infrastructure
| Cost | Amount | Notes |
|------|--------|-------|
| EC2 share | £7/month | Shared with 2 other apps |
| S3 storage | £0.003/user/month | Documents + PDFs |
| Domain/SSL | £0 | Let's Encrypt, subdomain |

---

## Profit Per User

### Consultation (£15)
| Item | Amount |
|------|--------|
| Revenue | £15.00 |
| Stripe | -£0.41 |
| OpenAI | -£0.73 |
| S3 | -£0.003 |
| **Profit** | **£13.86 (92.4% margin)** |

### Monthly (£7)
| Item | Amount/month |
|------|-------------|
| Revenue | £7.00 |
| Stripe | -£0.30 |
| OpenAI | -£0.32 |
| **Profit/month** | **£6.38 (91.1%)** |
| **Annual** | **£76.56** |

### Broker Review (£75)
| Item | Amount |
|------|--------|
| Revenue | £75.00 |
| Stripe | -£1.25 |
| OpenAI | -£0.02 |
| **Profit** | **£73.73 (98.3%)** |

---

## Revenue Projections

### 1 User
| Stream | Amount |
|--------|--------|
| Consultation | £15.00 |
| Costs | -£1.14 |
| **Net** | **£13.86** |

### 100 Users/month (20% conversion)
| Item | Amount |
|------|--------|
| 20 consultations × £15 | £300 |
| 10 subscriptions × £7 | £70/mo |
| 5 broker reviews × £75 | £375 |
| **Monthly revenue** | **£745** |
| Stripe | -£42 |
| OpenAI | -£25 |
| Server | -£7 |
| **Monthly profit** | **£671** |
| **Annual** | **£8,050** |

### 1,000 Users/month
| Item | Amount |
|------|--------|
| 200 consultations × £15 | £3,000 |
| 100 subscriptions × £7 | £700/mo |
| 50 broker reviews × £75 | £3,750 |
| **Monthly revenue** | **£7,450** |
| Stripe | -£420 |
| OpenAI | -£250 |
| Server | -£30 |
| **Monthly profit** | **£6,750** |
| **Annual** | **£81,000** |

---

## Feature Brainstorm — How to Make It More Useful

### 🔥 HIGH IMPACT — Quick Wins

#### 1. Real-Time Rate Tracker
Scrape/API top UK lender rates daily. Show "Today's Best Rates" on landing + dashboard.
- 2-year fixed, 5-year fixed, tracker rates
- Filter by LTV tier (60%, 75%, 90%, 95%)
- Alert when rates drop below user's threshold
- **Why**: Users come back daily to check rates

#### 2. Affordability Stress Test
Show what happens if rates go up 1%, 2%, 3%:
- "At 6.5% your payment would be £X,XXX (+£XXX/month)"
- "Bank of England stress test rate: 8% — your payment: £X,XXX"
- Visual chart showing payment at different rates
- **Why**: Banks do this — users should see it first

#### 3. Property Search Integration
Link to Rightmove/Zoopla with pre-filtered results:
- "Properties you can afford" based on borrowing capacity
- Map view of areas within budget
- Saved searches with alerts
- **Why**: Connects mortgage advice to actual property shopping

#### 4. Mortgage Renewal Reminder
For remortgage users:
- Track when current deal expires
- Start remortgage process 3-6 months early
- Compare new rates vs current
- Email/push notification reminders
- **Why**: Recurring revenue from remortgage users

#### 5. Credit Score Improvement Plan
Based on uploaded credit report:
- Specific actions to improve score (reduce utilisation, register to vote, etc.)
- Timeline: "Do X now, score improves ~Y points in Z months"
- Track progress over time
- **Why**: Users with poor credit need help before applying

### 💰 REVENUE BOOSTERS

#### 6. Mortgage Broker Referral Network
Partner with real mortgage brokers (whole-of-market):
- AI pre-qualifies applicant
- Sends warm lead to broker with full documentation pack
- Broker pays referral fee (£200-500 per completed mortgage)
- **Revenue potential**: 10x current pricing per user
- **Why**: This is where the REAL money is in mortgage advice

#### 7. Conveyancing Quote Comparison
After mortgage approval stage:
- Compare solicitor/conveyancer quotes
- Include searches, fees, timelines
- Affiliate commissions from conveyancers
- **Why**: Every buyer needs a solicitor — natural next step

#### 8. Insurance Upsell (Life, Buildings, Contents)
Mortgage requires life insurance and buildings insurance:
- Compare quotes from major insurers
- Affiliate commissions
- "Your lender requires buildings insurance — here are the best quotes"
- **Why**: Mandatory products with good affiliate commissions

#### 9. Premium "Fast Track" Plan (£49)
- Priority document review
- Direct WhatsApp support
- Guaranteed response within 2 hours
- Pre-filled mortgage application forms
- **Why**: Time-sensitive buyers will pay for speed

### 🧠 AI IMPROVEMENTS

#### 10. Application Form Auto-Fill
Based on uploaded documents, auto-fill:
- Barclays mortgage application form
- Halifax mortgage application form
- Nationwide mortgage application form
- Export as PDF ready to submit
- **Why**: Saves hours of form-filling

#### 11. Lender Matching Algorithm
Beyond generic comparison — actual eligibility scoring:
- "92% match: Halifax — accepts director income, your LTV qualifies"
- "67% match: HSBC — may reject due to income inconsistency"
- Factor in: credit score, income type, LTV, employment history
- **Why**: Users want to know WHERE to apply, not just rates

#### 12. Document OCR + Auto-Extract
Instead of just classifying uploaded docs:
- OCR passport to extract name, DOB, expiry
- OCR payslip to extract gross pay, net pay, tax code
- OCR bank statement to extract balance, transactions
- Auto-populate affordability calculator
- **Why**: Eliminates manual data entry

#### 13. Multi-Applicant Support
Full joint application workflow:
- Separate document checklists per applicant
- Combined affordability calculation
- Track each applicant's progress independently
- **Why**: 60%+ of mortgages are joint applications

### 📊 UX IMPROVEMENTS

#### 14. Timeline / Gantt Chart
Visual mortgage journey timeline:
- Document collection → Mortgage application → Valuation → Offer → Exchange → Completion
- Estimated dates based on average processing times
- Drag to adjust, see how delays cascade
- **Why**: Buying a house is stressful — timeline reduces anxiety

#### 15. Mortgage Jargon Glossary
Pop-up definitions for terms:
- LTV, SVR, ERC, APRC, MIG, AIP, DIP
- Contextual — appears when term is used in chat
- **Why**: First-time buyers don't know these terms

#### 16. Comparison with Renting
Show: "Buying vs Renting over 5/10/25 years"
- Include: equity built, tax benefits, maintenance costs
- Break-even point calculation
- **Why**: Helps hesitant buyers make the decision

#### 17. Neighbourhood Data
When property address is entered:
- Crime rates, school ratings, transport links
- Average property prices in the area
- Price growth history
- **Why**: Adds value beyond just mortgage numbers

### 🔒 TRUST & CONVERSION

#### 18. AIP (Agreement in Principle) Generator
AI generates a mock AIP document showing:
- Estimated borrowing amount
- Based on income evidence provided
- "Take this to estate agents to strengthen your offer"
- Clear disclaimer: not an official AIP
- **Why**: Estate agents want proof of affordability

#### 19. Success Stories / Case Studies
Real anonymised case studies:
- "Company director, £85k income, 20% deposit → £380k mortgage with Halifax"
- Show the journey from document upload to completion
- **Why**: Builds trust for director/self-employed applicants

#### 20. Live Chat with Human Backup
When AI can't answer:
- Escalate to human adviser (partner broker)
- Pay-per-question: £5 per human answer
- **Why**: Captures users the AI can't help

---

## Recommended Priority

**Phase 1 — This week:**
1. Affordability Stress Test (#2) — easy to build, high value
2. Credit Score Improvement Plan (#5) — uses existing credit report data
3. Mortgage Jargon Glossary (#15) — quick win for UX

**Phase 2 — Next sprint:**
4. Lender Matching Algorithm (#11) — key differentiator
5. Application Form Auto-Fill (#10) — saves users hours
6. Real-Time Rate Tracker (#1) — brings users back daily

**Phase 3 — Growth:**
7. Mortgage Broker Referral Network (#6) — 10x revenue
8. Conveyancing + Insurance (#7, #8) — affiliate revenue
9. Property Search Integration (#3) — makes app a hub

**Phase 4 — Advanced:**
10. Document OCR (#12)
11. Timeline / Gantt (#14)
12. AIP Generator (#18)
13. Premium Fast Track (#9)

---

## Competitive Landscape

| Competitor | Price | What They Do | Our Advantage |
|-----------|-------|-------------|---------------|
| Habito | Free (broker) | Online mortgage broker | We're AI-first, instant advice |
| Trussle | Free (broker) | Online mortgage broker | We give detailed strategy PDFs |
| MoneySupermarket | Free | Rate comparison | We analyse YOUR documents |
| L&C Mortgages | Free (broker) | Phone-based broker | We're 24/7 AI, no waiting |
| A mortgage broker | £500-1000 | Full service | We're £15, they're £500+ |

**Our unique selling point**: Upload your actual documents → get personalised advice with specific numbers, not generic rate tables.

---

## Key Metrics to Track
- Trial → Paid conversion rate (target: 25%)
- Documents uploaded per user (target: 8+)
- Readiness score improvement over time
- Broker review attach rate (target: 10%)
- Average time from signup to "mortgage ready"
- Monthly active users (subscription retention)
- Referral rate (users recommending to friends)
