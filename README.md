# AutismEarlyAI — Transparent Q-CHAT-10 Screener + Leakage Research

Live: https://autismearlyai.org/

> **Screening, not diagnosis.** This site scores a published 10-question toddler checklist with its published rule. It contains **no AI model**, is **not a medical device**, and does **not store answers**.

## What the site does

1. **Questionnaire** — the 10 items of the Q-CHAT-10 (Quantitative Checklist for Autism in Toddlers, 10-item version), for toddlers about 18–24 months old.
2. **Transparent score** — items 1–9 score 1 point for options C, D or E; item 10 scores 1 point for options A, B or C. A total **above 3** suggests referral for a specialist evaluation. The result page shows exactly which answers produced each point.
3. **Research page** — a reproducible leakage check showing why this site does not offer an AI model.

## Why there is no AI model

On the widely used public *Toddler Autism dataset July 2018* (F. Thabtah, 2018; 1,054 toddlers), the "ASD traits" label equals the Q-CHAT-10 total above 3 in **100%** of rows. Results after removing duplicates (975 rows), 5-fold stratified CV repeated 5 times:

| Model and features | AUC (mean ± SD) | Balanced accuracy |
|---|---|---|
| Logistic regression — 10 questionnaire items | 1.000 ± 0.000 | 1.000 |
| Logistic regression — demographics only | 0.592 ± 0.046 | 0.512 |
| Gradient boosting — demographics only | 0.599 ± 0.049 | 0.526 |

The perfect score is **label leakage**: the model re-learns the questionnaire's own addition rule. Without the answers, demographic features perform near chance. Because the label is a questionnaire cutoff and not a clinical diagnosis, no model trained on this dataset can be called clinically validated.

Reproduce: `pip install pandas scikit-learn`, obtain the public CSV, then
`python research/evaluate.py "Toddler Autism dataset July 2018.csv" api/research_results.json`.
(The dataset is not redistributed in this repository.)

## Correction notice

Earlier versions of this repository and website were a face-image interface demo that displayed **simulated outputs**: a randomly generated "ASD probability" and an illustrative heatmap drawn over fixed face regions, labelled "ASD-FaceNet v2.1.3" and "Grad-CAM". No model produced those outputs, and earlier descriptions of the project as a "deployed" AI system were inaccurate. That demo was removed in November 2026; its code remains visible in the commit history.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/instrument` | Items, response options, scoring rule, source |
| `POST /api/score` | `{"answers":[0-4 x 10]}` → total, per-item points, cutoff result |
| `GET /api/research` | Leakage-check results |
| `GET /api/health` | Status (`ml_model: false`, `stores_data: false`) |

## Sources and licence

- Allison C, Auyeung B, Baron-Cohen S. Toward brief "Red Flags" for autism screening. *J Am Acad Child Adolesc Psychiatry*. 2012;51(2):202–212.
- Q-CHAT item wording: Allison et al. (2008), Autism Research Centre, University of Cambridge — CC BY-NC 4.0. **Non-commercial use only.**
- Scoring rule and cutoff: Autism Research Centre Q-CHAT-10 form.
- CDC ADDM Network (2025 report): about 1 in 31 eight-year-olds identified with autism in 2022.

## Author

Md Nuruzzaman Pranto — research on transparent, leakage-controlled evaluation of early-autism screening tools.
