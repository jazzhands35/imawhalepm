# Shane Call Updates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all homepage changes from Shane's March 19 call + About Us page + live ticker via Cloudflare Worker.

**Architecture:** Single-page static site (index.html) with inline CSS/JS. New about.html page. New Cloudflare Worker for live ticker data proxy. GitHub Pages hosted.

**Tech Stack:** HTML/CSS/JS (inline), Cloudflare Workers (JS)

---

### Task 1: Hero — IMAWHALEPM Front and Center

**Files:** Modify: `index.html:507-518`

- [ ] **Step 1:** Change hero h1 to show "IMAWHALEPM" as the big headline with gradient, and "The Liquidity Layer for Prediction Markets" as smaller subtitle below.
- [ ] **Step 2:** Add CSS for the new hero brand name (large, gradient text) and subtitle styling.
- [ ] **Step 3:** Verify in browser, commit.

### Task 2: Stats — Replace Liquidity with Experience

**Files:** Modify: `index.html:546-551`

- [ ] **Step 1:** Replace `$2.4M Liquidity` stat card with `15+ Years Experience`. Update data attributes.
- [ ] **Step 2:** Commit.

### Task 3: Quotes — Example Quotes with Bigger Sizes

**Files:** Modify: `index.html:565-604`

- [ ] **Step 1:** Change "live-quotes" → "example-quotes" in terminal header.
- [ ] **Step 2:** Change "Live Quoting" label → "Example Quoting".
- [ ] **Step 3:** Update contract sizes to 300K, 50K, 100K and volumes to $4.8M, $3.1M, $12.7M.
- [ ] **Step 4:** Update JS flicker sizes array to match larger sizes.
- [ ] **Step 5:** Commit.

### Task 4: Venues — Correct Exchanges

**Files:** Modify: `index.html:606-628`

- [ ] **Step 1:** Change Polymarket → Polymarket US, badge stays.
- [ ] **Step 2:** Change Robinhood → Crypto.com US, badge → "Launching Soon".
- [ ] **Step 3:** Change More Coming → Publicis, badge → "Launching Soon".
- [ ] **Step 4:** Add CSS class for "launching soon" badge style.
- [ ] **Step 5:** Commit.

### Task 5: Research — Real Articles

**Files:** Modify: `index.html:630-639`

- [ ] **Step 1:** Replace 3 placeholder blog posts with CNBC, KPMG, CoinDesk articles as clickable external links.
- [ ] **Step 2:** Update section subtitle.
- [ ] **Step 3:** Commit.

### Task 6: Careers Button → Contact

**Files:** Modify: `index.html:646`

- [ ] **Step 1:** Change "View Careers →" href to `#contact` and text to "Contact Us →".
- [ ] **Step 2:** Commit.

### Task 7: Nav — Add About Us Link

**Files:** Modify: `index.html:496-502`

- [ ] **Step 1:** Add "About Us" link pointing to `about.html`.
- [ ] **Step 2:** Commit.

### Task 8: About Us Page

**Files:** Create: `about.html`

- [ ] **Step 1:** Create about.html with same design language (CSS, nav, footer) as index.html.
- [ ] **Step 2:** Add placeholder bio section for Shane with placeholder photo and text.
- [ ] **Step 3:** Commit.

### Task 9: Cloudflare Worker — Live Ticker Proxy

**Files:** Create: `worker/index.js`, Create: `worker/wrangler.toml`

- [ ] **Step 1:** Write Cloudflare Worker that fetches from Kalshi + Polymarket Gamma APIs, normalizes, caches 60s.
- [ ] **Step 2:** Write wrangler.toml config.
- [ ] **Step 3:** Commit.

### Task 10: Wire Live Ticker

**Files:** Modify: `index.html:520-544, 657-794`

- [ ] **Step 1:** Replace hardcoded ticker HTML with a container div.
- [ ] **Step 2:** Add JS to fetch from worker endpoint, populate ticker, handle errors with graceful fallback.
- [ ] **Step 3:** Keep CSS animation for scrolling.
- [ ] **Step 4:** Commit.
