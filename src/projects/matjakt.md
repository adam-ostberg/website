---
title: "Matjakt: the cheapest basket across ~500 grocery stores"
date: 2026-06-01
summary: Built Matjakt, which scrapes prices from around 500 Swedish grocery stores and works out the cheapest way to buy your whole shopping list.
stack: [Python, Scrapy, PostgreSQL, React]
featured: true
image: /assets/img/Matjakt.webp   # optional thumbnail in lists
imageAlt: An image of the front page of Matjakt
links:
  demo: https://matjakt.org/
  website: https://github.com/adam-ostberg/matjakt
  scraper: https://github.com/adam-ostberg/matjakt-scraper
---
{% note %}
My bachelor's thesis at KTH, *Digitalization and Visualization of Grocery Prices for Optimized Purchasing Decisions*, built with three classmates. I built the scraping and ingestion pipeline, and parts of the website. **4.3 million prices | 57,000 products | ~500 stores**
{% endnote %}

## Why this one

Swedish food prices rose 18.6% in 2022 and have stayed high. Prices also differ a lot between chains, and even between stores in the same chain. But the only ways to compare them were an annual survey based on receipts or apps that list weekly deals. We wanted to put in a whole shopping list and find out where it's cheapest to buy it, today.

## How it works

Every store has its own prices, so each of those 57,000 products can have hundreds of different prices across the country. That's where the 4.3 million price rows come from, and getting them all in is most of the engineering.

- **Scraping.** One Scrapy spider per store, run in parallel against ICA and Coop. Their product APIs block plain HTTP clients, so each spider gets past the bot check once in a real Playwright browser and then calls the JSON endpoints from inside the page. A big store has tens of thousands of products, so detail requests go out in concurrent batches of 50.
- **Ingestion.** Raw results are written to NDJSON files, bulk-loaded into Postgres (Supabase) and merged into normalised tables. Every price that differs from the last run goes into an append-only price-history table. If a run fails halfway, we re-run the load from the files instead of scraping again.
- **Optimising the basket.** For each item, the site picks the cheapest store within your radius, among stores you choose, or anywhere in Sweden. It then draws the route on a map (Leaflet + OSRM) and uses live fuel prices to estimate what the drive will cost.

![The Matjakt checkout view, with an optimised basket and a route on the map](/assets/img/MatjaktCheckout.webp)

## What happened

We tested it with 20 people. 19 of them said it could cut their grocery bill, and 19 said it made comparing prices easier than doing it by hand. Liking it didn't depend on age, gender or how comfortable someone was with technology. None of those correlations was significant, though with only 20 people that doesn't prove much.

We also showed it to about 40 visitors at Tekniska museet in Stockholm. Their most common request was "just tell me the cheapest single store near me". One person wanted the same thing for pharmacies.

## What I learned

- **Scraping at scale is slow.** We planned daily updates, but one full run took over 20 hours, so we had to settle for updating every so often.
- **People need to understand the recommendations.** Users liked the design, but only about half understood why the site recommended what it did.
- **Per-item optimisation is naive.** Buying every item at its cheapest store ignores the cost of driving to five shops. The proper version of this problem, the Internet Shopping Optimization Problem, prices the travel in.

## What I'd do next

- Optimise for the whole trip, travel included, instead of item by item.
- Measure what people actually spend using their receipts, not just what they say in a survey.
