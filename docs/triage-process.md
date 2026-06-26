# Maintainer Issue Triage Process

**Triage Process**

- **Purpose:** Provide a repeatable daily workflow for maintainers to triage issues, signals, and operational alerts without changing GitHub permissions.

**Triage States**
- `unassigned`: No maintainer owns the issue; default incoming state.
- `claimed`: A maintainer has taken ownership and is working the issue.
- `blocked`: Work cannot proceed until an external dependency or data is available.
- `review-needed`: Work complete, needs another maintainer to approve or verify.

**Daily Maintainer Workflow (repeatable)**
1. Morning scan (10–20 minutes): run saved searches (examples below) to collect new `unassigned` items.
2. Claim items you can resolve quickly. Mark as `claimed` in the issue body or labels.
3. For items needing input (from ops, infra, nodes, or third parties), mark `blocked` and add a clear next-step.
4. For code or strategy changes finish work and mark `review-needed` with a short checklist.
5. End-of-day: update any long-running `claimed` items with progress notes and estimate next steps.

**Saved-search examples / lightweight reporting**
We keep some simple shell helpers in `scripts/` to produce lists you can paste into Slack or create issues from.

- `scripts/maintainer_saved_searches.sh` — example saved searches for quick triage (example usage: run locally and paste results into a triage ticket).
- `scripts/issue-triage.js` — automated dashboard showing current triage state counts (see below).

**Escalation & Handoff**
- If something is `blocked` for >24h, ping the on-call channel with a short context message and link.
- For `review-needed`, if no reviewer in 24h, post a short summary and tag the rotation-maintainers group.

**Notes**
- This process is intentionally permission-agnostic. Use labels and issue body markers rather than requiring new team membership.

---

# Weekly Triage Dashboard & Workflow

This document outlines the weekly issue triage workflow for the StellarYield maintainers, particularly for the Stellar Wave program.

## Maintainer Triage Dashboard

Run this command to get a quick overview of all triage-relevant issues:

```bash
GITHUB_TOKEN=ghp_xxx node scripts/issue-triage.js
```

**Output example:**
```
📊 StellarYield Maintainer Triage Dashboard
==================================================

🆓 Unclaimed Wave Issues:      12
✅ Claimed Wave Issues:        5
👀 Wave PRs (all states):      3
⛔ Blocked Issues:             2
❓ Needs Info:                 1
📈 Total Open Issues:          28
```

### Setting up the GitHub Token

1. Visit https://github.com/settings/tokens/new
2. Create a **Personal Access Token (Classic)** with these scopes:
   - `repo` (full control of private repositories)
   - `public_repo` (access to public repositories)
3. Copy the token and save it securely:
   ```bash
   export GITHUB_TOKEN=ghp_xxx
   ```
4. Run the dashboard script:
   ```bash
   node scripts/issue-triage.js
   ```

## Saved Search Queries / Triage States

To maintain visibility over community contributions, use the following GitHub search queries:

1. **Unclaimed Issues (Ready for Community)**
   ```
   is:issue is:open label:"Stellar Wave" label:"help wanted" no:assignee
   ```
   *Action:* Review for clarity, add 'good first issue' if applicable.

2. **Claimed Issues (In Progress)**
   ```
   is:issue is:open label:"Stellar Wave" has:assignee -linked:pr
   ```
   *Action:* Ping assignees if there has been no activity for >7 days.

3. **Ready for Review (PR Submitted)**
   ```
   is:pr is:open label:"Stellar Wave" review:required
   ```
   *Action:* Assign a maintainer to review.

4. **Blocked / Needs Input**
   ```
   is:issue is:open label:blocked
   ```
   or
   ```
   is:issue is:open label:"needs info"
   ```
   *Action:* Follow up on requested information.

### Creating Saved Searches

1. Go to https://github.com/edehvictor/StellarYield/issues
2. Paste one of the query strings above into the search box
3. Click the **Save** button (or bookmark the URL)
4. Refer to your saved searches during triage

## Weekly Triage Workflow

Every Monday (or on your chosen triage day), maintainers should follow this process:

### 1. Run the Dashboard (5 minutes)
```bash
GITHUB_TOKEN=ghp_xxx node scripts/issue-triage.js
```
Note the counts for unclaimed, claimed, blocked, and needs-info issues.

### 2. Review New Issues (10 minutes)
- Visit the **Unclaimed Wave Issues** saved search
- For each new issue:
  - ✅ Verify it has clear acceptance criteria
  - ✅ Assign appropriate labels (`bug`, `enhancement`, `points: 200`, etc.)
  - ✅ Add `good first issue` if suitable for newcomers
  - ✅ Ping on-call ops if it requires urgent action (e.g., production outage)

### 3. Check Stale Claims (10 minutes)
- Visit the **Claimed Wave Issues** saved search
- For each claimed issue with no activity for >7 days:
  - 💬 Leave a comment: `@user, checking in — any blockers on this?`
  - 🔄 If no response in 24h, unassign and re-label as `unclaimed`
  - 🙋 Consider offering help or pairing

### 4. Unblock Contributors (10 minutes)
- Visit the **Blocked Issues** and **Needs Info** saved searches
- Answer open questions or provide requested data
- Remove the `blocked` or `needs info` label once resolved

### 5. Review PRs (10 minutes)
- Visit the **Ready for Review** saved search
- Assign a reviewer if one hasn't been assigned
- Track PR approval status in a shared triage issue (optional)

### 6. Document & Slack Summary (5 minutes)
Post a quick summary to your maintainer channel:
```
📊 Weekly Triage Summary
- Unclaimed: 12 (↑2 from last week)
- Claimed: 5 (→ stable)
- Blocked: 2 (⚠️ 1 waiting on infra)
- PRs pending: 3
→ Action: Follow up on issue #XXX (needs external data)
```

## Public Contributor Considerations

Ensure that labels are clear, and that any "claimed" state is visibly marked by assigning the user. If the user cannot be assigned due to GitHub permissions, add a comment explicitly stating: `@username has claimed this issue.`

### Good First Issue Best Practices

1. **Clear scope:** Acceptance criteria should fit in 1–2 hours of work
2. **Helpful context:** Link to relevant code, docs, and related issues
3. **Responsive:** Plan to review PRs within 24 hours
4. **Encouraging:** Welcome first-time contributors and offer help in reviews

## Escalation Playbook

| Situation | Action | Time |
| --- | --- | --- |
| **Claimed issue, no update >7d** | Comment `@user checking in — any blockers?` | Within 1 day |
| **Blocked issue, no data >24h** | Ping on-call channel or escalate to relevant team | Immediately |
| **PR pending review >48h** | Tag rotation-maintainers group or escalate | Immediately |
| **Unclassified issue, unclear scope** | Mark `needs clarification` and comment with questions | Within 1 day |

## Tools & Links

- **Triage Dashboard:** `node scripts/issue-triage.js`
- **Saved Searches:** https://github.com/edehvictor/StellarYield/issues
- **GitHub Tokens:** https://github.com/settings/tokens
- **Stellar Wave Program:** See root `README.md` for Wave details
