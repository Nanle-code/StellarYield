#!/usr/bin/env node
/**
 * Maintainer issue triage dashboard.
 * Fetches issue and PR counts by triage state for quick daily/weekly reviews.
 * 
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/issue-triage.js
 * 
 * Requirements:
 *   - Node.js with fetch support (v18+) or Node.js with node-fetch installed
 *   - GITHUB_TOKEN environment variable (create one at https://github.com/settings/tokens)
 * 
 * The script queries GitHub API v3 to count issues by label/state/assignee.
 */

const REPO_OWNER = "edehvictor";
const REPO_NAME = "StellarYield";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ GITHUB_TOKEN not set. Set it and try again:");
  console.error("   export GITHUB_TOKEN=ghp_xxx");
  process.exit(1);
}

const BASE_URL = "https://api.github.com";

async function fetchGitHub(query) {
  const url = `${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues?${query}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    console.error(`❌ GitHub API error: ${res.status}`);
    if (res.status === 401) {
      console.error("   Check that GITHUB_TOKEN is valid (view https://github.com/settings/tokens)");
    }
    if (res.status === 403) {
      console.error("   Rate limited. Try again in a few minutes or use a GitHub App token.");
    }
    process.exit(1);
  }

  return res.json();
}

async function countIssues(query) {
  const issues = await fetchGitHub(query);
  return issues.length;
}

async function main() {
  console.log("📊 StellarYield Maintainer Triage Dashboard");
  console.log("═".repeat(50));
  console.log();

  try {
    // Stellar Wave: Unclaimed issues
    const unclaimedCount = await countIssues(
      "state=open&labels=Stellar Wave,help wanted&assignee=none&per_page=100"
    );
    console.log(`🆓 Unclaimed Wave Issues:      ${unclaimedCount}`);

    // Stellar Wave: Claimed issues (with assignee)
    const claimedCount = await countIssues(
      "state=open&labels=Stellar Wave&assignee=*&no=linked-pr&per_page=100"
    );
    console.log(`✅ Claimed Wave Issues:        ${claimedCount}`);

    // PRs ready for review (Stellar Wave)
    const reviewCount = await countIssues(
      "state=open&labels=Stellar Wave&type=pr&per_page=100"
    );
    console.log(`👀 Wave PRs (all states):      ${reviewCount}`);

    // Blocked issues
    const blockedCount = await countIssues(
      "state=open&labels=blocked&per_page=100"
    );
    console.log(`⛔ Blocked Issues:             ${blockedCount}`);

    // Needs info
    const needsInfoCount = await countIssues(
      "state=open&labels=needs info&per_page=100"
    );
    console.log(`❓ Needs Info:                 ${needsInfoCount}`);

    // Total open issues
    const totalCount = await countIssues(
      "state=open&per_page=100"
    );
    console.log(`📈 Total Open Issues:          ${totalCount}`);

    console.log();
    console.log("═".repeat(50));
    console.log("💡 Tip: Use GitHub saved searches for detailed lists:");
    console.log("   1. Unclaimed Wave:");
    console.log("      is:issue is:open label:\"Stellar Wave\" label:\"help wanted\" no:assignee");
    console.log("   2. Claimed Wave:");
    console.log("      is:issue is:open label:\"Stellar Wave\" has:assignee -linked:pr");
    console.log("   3. Blocked:");
    console.log("      is:issue is:open label:blocked");
    console.log("   4. Needs Info:");
    console.log("      is:issue is:open label:\"needs info\"");
    console.log();
    console.log("📖 Read the full workflow at: docs/triage-process.md");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
