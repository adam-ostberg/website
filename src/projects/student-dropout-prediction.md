---
title: Student dropout prediction
date: 2025-05-19
summary: Trained five classifiers to predict whether a student graduates or drops out, then built a small app so we could ask it about ourselves.
stack: [Python, scikit-learn, XGBoost]
featured: true
image: /assets/img/DropoutPredictionClustering.webp   # optional thumbnail in lists
imageAlt: Hierarchical clustering of the student dataset in PCA space.
links:
  analysis: https://colab.research.google.com/drive/1IGcsx_nBA0Jz5tbWTJ0sau8eOPYv9961?usp=sharing
  models: https://colab.research.google.com/drive/17rqJEVNt7VB5ke9urzUtxbbjRs4feyeD?usp=sharing
---

Final project for DM1590 Machine Learning at KTH, built with three classmates.

## Why this one

We had a few datasets to choose from. We picked academic success for a simple reason: we wanted to know what a model would say about us.

## Approach

The data covers 4,424 Portuguese undergraduates with 36 features: grades, demographics, family background and finances. Each student is labelled graduate, dropout or still enrolled.

- **Exploring first.** PCA down to 2D plus hierarchical clustering showed clear structure. Dropouts and graduates separated nicely, but "enrolled" students were spread across everything and confused every model, so we dropped that class (3,630 students left).
- **Picking features we could actually answer.** `SelectKBest` (chi²) gave us ten features, and we cut them by hand to six that a Swedish student could fill in honestly: marital status, application order, previous qualification, father's occupation, debtor status and gender. Nationality, scholarships and tuition fees didn't map onto Sweden, so they went.
- **Comparing models.** kNN, Random Forest, Naive Bayes, logistic regression and XGBoost. We tuned XGBoost with `GridSearchCV`.

{% image "/assets/img/DropoutPredictionClustering.webp", "Hierarchical clustering on the PCA-reduced data", "60%" %}

## Results

| Model               | Accuracy | Dropout recall | Dropout F1 |
| ------------------- | -------- | -------------- | ---------- |
| Naive Bayes         | 0.55     | 0.27           | 0.33       |
| kNN (k = 8)         | 0.63     | 0.55           | 0.55       |
| Random Forest       | 0.64     | 0.46           | 0.52       |
| Logistic regression | 0.70     | 0.48           | –          |
| XGBoost (tuned)     | **0.72** | 0.47           | 0.55       |

Not bad for six features out of 36. XGBoost went into a small app where you enter your six values and get a verdict.

Then we tried it on ourselves. Three of the four of us were predicted to drop out. It turned out that switching "debtor" to "non-debtor" made all of us graduate. That's a Portuguese dataset talking: there, debtors were about three times as likely to drop out, while in Sweden almost every student has a loan.

## What I learned

- **Who the data comes from matters.** A model trained on one country's students says little about another's.
- **The bias was easy to see.** Changing only gender sometimes flipped the prediction.
- **Accuracy wasn't the number that mattered.** Every model was much better at spotting graduates than dropouts, and dropouts are the students you would actually want to find.

## What I'd do next

- Handle the class imbalance properly with class weights or SMOTE, and stop just reporting around it.
- Train on Nordic data, if anyone ever releases it.
