---
title: Cross-store product matching with XGBoost
date: 2026-11-03
summary: Matched identical products across Sweden's two biggest grocery chains with a small ML pipeline, then compared 7,659 prices. Coop wins, mostly.
stack: [Python, scikit-learn, XGBoost]
featured: true
image: /assets/img/ProductMatcherPriceDifferenceThumb.png   # cropped for the card
previewImage: /assets/img/ProductMatcherPriceDifference.png   # full chart for link previews
imageAlt: A chart of the price difference between ICA and Coop for 7,659 identical products
links:
  code: https://github.com/adam-ostberg/product-matcher
---
{% note %}
A side project built on the data from [Matjakt](/projects/matjakt/). **7,659 matched products | Coop cheaper on 49%, ICA on 24%**
{% endnote %}

## Why this one

Everyone in Sweden has an opinion on whether ICA or Coop is cheaper. I had the prices for both, scraped for Matjakt, so I wanted an actual answer. The catch: to compare fairly you have to compare the *same* product in both stores, and ICA's product data has no barcodes. Nothing to join on. So before I could compare a single price, I had to work out which products were the same.

![Price difference for 7,659 identical products](/assets/img/ProductMatcherPriceDifference.png)

## The answer

Across 7,659 identical products, **Coop is cheaper on 49%**, ICA on 24%, and 27% cost the same (within ±2.5%). The median product costs 2.4% more at ICA, and buying one of everything would cost 1.3% more at ICA. So Coop wins, but not by much.

It depends on the brand, too. Nelson Garden seeds and bulbs are cheaper at ICA 89% of the time, so if you're planting tomatoes, go to ICA. If you're buying them in a can, go to Coop.

## Why matching is harder than it sounds

- **No shared key.** Coop identifies products by barcode (EAN), ICA by an internal ID. All I had to go on were names, brands, pack sizes and prices.
- **"Identical" is strict.** Same brand *and* same size. A 400 g can of Mutti tomatoes is not the same product as a three-pack of them, or a 500 g carton. Private labels like ICA, Coop and Änglamark can't have a match, so they're left out.
- **The stores write things differently.** ICA tends to put brand and size in the name (`Finkrossade Tomater Polpa 400g Mutti`), Coop doesn't (`Tomater Finkrossade`). Then there's `0,5L` vs `50cl`, and `Eget Bageri` vs `egetbageri`.
- **No labels.** No barcodes means no ground truth, so I built a labeling tool and labeled 424 products by hand.

## How it works

1. **Cleaning up.** Normalise names and brands, and parse pack sizes so that `6x33cl`, `0,5L` and `Läsk 33cl 10-p` all become a number in g, ml or pieces. Then strip brand and size out of the names so both stores' names look alike.
2. **Finding candidates.** TF-IDF on character n-grams finds the 10 most similar ICA products for each of the 26,814 eligible Coop products. Size is left out on purpose, so the same product in the wrong size shows up as a hard negative for the model to learn from.
3. **Labeling.** A small React app with keyboard shortcuts: pick the identical product among the 10, or say none of them match. Products come in random order, so the labels are a random sample.
4. **The model.** Each (Coop product, ICA candidate) pair gets 10 features, such as the TF-IDF score, how far it trails the best candidate, whether brands match, and the size and price ratios. XGBoost scores every pair, and the best candidate counts as a match only if it clears a threshold.
5. **Evaluation.** Cross-validated grouped by Coop product, so a product's candidates never end up split between training and test. 123 products were set aside and scored once, at the very end.

{% image "/assets/img/ProductMatcherLabeler.jpg", "The labeling tool: a Coop can of Mutti tomatoes and ten ICA candidates", "100%", "The top TF-IDF hit is the 1.2 kg three-pack. The identical 400 g can is second, so the model has to learn more than \"take the top hit\"." %}

## Results

On the held-out test set (109 products after skipping the ones I was unsure about):

| Method                    | Precision | Recall    | Accuracy  |
| ------------------------- | --------- | --------- | --------- |
| TF-IDF + tuned threshold  | 0.635     | **0.746** | 0.725     |
| XGBoost                   | **0.889** | 0.635     | **0.771** |

I picked the threshold to aim for about 90% precision, because a wrong match adds a made-up price difference to the comparison. Missing a match costs much less than inventing one. Matching all Coop products gave 8,089 matches, and 7,659 were left after dropping goods sold by weight, unknown pack sizes and price gaps over 3x.

{% image "/assets/img/ProductMatcherLearningCurve.png", "Learning curves for precision, recall and accuracy against the number of labeled products", "100%" %}

## What I learned

- **More labels didn't buy precision.** Labeling more products raised recall but left precision flat. The two features that mattered most were the gap to the best candidate and the size ratio.
- **The first step sets the ceiling.** If the right product isn't in the TF-IDF top 10, no model downstream can find it, however good it is.
- **Small test sets give wide intervals.** With 109 products, the 95% confidence interval for precision runs from 0.79 to 0.98.
- **The answer only covers what can be matched.** Private labels and fresh goods sold by weight are left out, and that's where a lot of the real price competition happens. Prices are also from a single snapshot in spring 2026, with ICA's averaged across stores since each ICA store sets its own.
