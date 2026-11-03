"""
AutismEarlyAI - transparent Q-CHAT-10 screening tool + research results.

What this service does
- Serves the 10 items of the Q-CHAT-10 (Quantitative Checklist for Autism in
  Toddlers, 10-item version; Allison, Auyeung & Baron-Cohen, 2012, JAACAP
  51(2):202-212). Item wording follows the published Q-CHAT (Allison et al.,
  2008), distributed under CC BY-NC 4.0 (Autism Research Centre, University of
  Cambridge). Non-commercial use only.
- Scores answers with the published rule: items 1-9 score 1 point for
  responses C, D or E; item 10 scores 1 point for responses A, B or C.
  A total above 3 (out of 10) suggests referral for a specialist evaluation.
- Serves leakage-check results computed by research/evaluate.py.

What it does not do
- It does not diagnose autism and is not a medical device.
- Screening uses no AI. The site's AI (a logistic regression trained by
  research/evaluate.py) is a research demonstration only: on the public data
  it can only re-learn the questionnaire's own scoring rule (see /api/research).
- It does not store answers. Nothing is logged or saved.

Correction notice: earlier versions of this repository showed simulated,
randomly generated outputs from a face-image demo. Those were removed in
November 2026 and are visible in the commit history.
"""

import json
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

FREQ = ["Many times a day", "A few times a day", "A few times a week", "Less than once a week", "Never"]
ALWAYS = ["Always", "Usually", "Sometimes", "Rarely", "Never"]
EASE = ["Very easy", "Quite easy", "Quite difficult", "Very difficult", "Impossible"]
WORDS = ["Very typical", "Quite typical", "Slightly unusual", "Very unusual", "My child doesn't speak"]

# (id, text, options, indices that score 1)
ITEMS = [
    (1, "Does your child look at you when you call his/her name?", ALWAYS, {2, 3, 4}),
    (2, "How easy is it for you to get eye contact with your child?", EASE, {2, 3, 4}),
    (3, "Does your child point to indicate that s/he wants something (e.g. a toy that is out of reach)?", FREQ, {2, 3, 4}),
    (4, "Does your child point to share interest with you (e.g. pointing at an interesting sight)?", FREQ, {2, 3, 4}),
    (5, "Does your child pretend (e.g. care for dolls, talk on a toy phone)?", FREQ, {2, 3, 4}),
    (6, "Does your child follow where you're looking?", FREQ, {2, 3, 4}),
    (7, "If you or someone else in the family is visibly upset, does your child show signs of wanting to comfort them (e.g. stroking their hair, hugging them)?", ALWAYS, {2, 3, 4}),
    (8, "Would you describe your child's first words as:", WORDS, {2, 3, 4}),
    (9, "Does your child use simple gestures (e.g. wave goodbye)?", FREQ, {2, 3, 4}),
    (10, "Does your child stare at nothing with no apparent purpose?", FREQ, {0, 1, 2}),
]
CUTOFF = 3  # total > 3 suggests referral

SOURCE = {
    "instrument": "Q-CHAT-10 (Quantitative Checklist for Autism in Toddlers, 10-item version)",
    "citation": "Allison C, Auyeung B, Baron-Cohen S. Toward brief 'Red Flags' for autism screening. "
                "J Am Acad Child Adolesc Psychiatry. 2012;51(2):202-212.",
    "license": "Q-CHAT items: CC BY-NC 4.0, Autism Research Centre, University of Cambridge. Non-commercial use.",
    "age_range": "Developed for toddlers aged about 18-24 months.",
}

DISCLAIMER = (
    "This is a screening questionnaire, not a diagnosis, and not a medical device. "
    "A low score does not rule out autism and a high score does not confirm it. "
    "If you have any concern about a child's development, talk to a pediatrician or qualified clinician."
)


class ScoreRequest(BaseModel):
    answers: List[int] = Field(..., description="10 answers, each 0-4 (A-E)")


def score_answers(answers: List[int]) -> dict:
    if len(answers) != len(ITEMS):
        raise HTTPException(status_code=400, detail=f"Expected {len(ITEMS)} answers.")
    breakdown, total = [], 0
    for (iid, text, opts, scoring), a in zip(ITEMS, answers):
        if not isinstance(a, int) or a < 0 or a >= len(opts):
            raise HTTPException(status_code=400, detail=f"Item {iid}: answer must be 0-{len(opts) - 1}.")
        pts = 1 if a in scoring else 0
        total += pts
        breakdown.append({"item": iid, "question": text, "answer": opts[a], "points": pts})
    refer = total > CUTOFF
    return {
        "total": total,
        "max": len(ITEMS),
        "cutoff": f"A total above {CUTOFF} suggests referral",
        "result": "Above screening cutoff" if refer else "Below screening cutoff",
        "above_cutoff": refer,
        "next_step": (
            "Share these answers with your child's pediatrician and ask about a developmental evaluation."
            if refer else
            "Keep monitoring development. If you still have concerns, talk to your child's pediatrician."
        ),
        "breakdown": breakdown,
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "screening": "Q-CHAT-10 published rule (no AI)", "ai": "research demonstration only (logistic regression, leakage audit)", "stores_data": False}


@app.get("/api/instrument")
def instrument():
    return {
        "source": SOURCE,
        "items": [{"item": i, "question": t, "options": o} for i, t, o, _ in ITEMS],
        "scoring": "Items 1-9: 1 point for options C, D or E. Item 10: 1 point for options A, B or C. "
                   f"Total above {CUTOFF} suggests referral.",
        "disclaimer": DISCLAIMER,
    }


@app.post("/api/score")
def score(req: ScoreRequest):
    return score_answers(req.answers)


# --- BEGIN RESEARCH DATA (generated by research/evaluate.py) ---
RESEARCH_FALLBACK = json.loads(r'''{"dataset": "Toddler Autism dataset July 2018 (Q-CHAT-10), F. Thabtah, 2018", "evaluation": "5-fold stratified cross-validation repeated 5 times, after removing duplicate rows", "audit": {"n_rows": 1054, "label_equals_total_gt_3": 1.0, "total_column_equals_item_sum": 1.0, "n_after_dedup": 975, "positive_rate_after_dedup": 0.709}, "explorer": [{"groups": ["answers"], "model": "Logistic regression", "auc_mean": 1.0, "auc_sd": 0.0, "balanced_accuracy_mean": 1.0, "balanced_accuracy_sd": 0.0}, {"groups": ["total"], "model": "Logistic regression", "auc_mean": 1.0, "auc_sd": 0.0, "balanced_accuracy_mean": 1.0, "balanced_accuracy_sd": 0.0}, {"groups": ["demographics"], "model": "Logistic regression", "auc_mean": 0.592, "auc_sd": 0.046, "balanced_accuracy_mean": 0.512, "balanced_accuracy_sd": 0.016}, {"groups": ["answers", "total"], "model": "Logistic regression", "auc_mean": 1.0, "auc_sd": 0.0, "balanced_accuracy_mean": 1.0, "balanced_accuracy_sd": 0.0}, {"groups": ["answers", "demographics"], "model": "Logistic regression", "auc_mean": 1.0, "auc_sd": 0.0, "balanced_accuracy_mean": 0.999, "balanced_accuracy_sd": 0.003}, {"groups": ["total", "demographics"], "model": "Logistic regression", "auc_mean": 1.0, "auc_sd": 0.0, "balanced_accuracy_mean": 1.0, "balanced_accuracy_sd": 0.0}, {"groups": ["answers", "total", "demographics"], "model": "Logistic regression", "auc_mean": 1.0, "auc_sd": 0.0, "balanced_accuracy_mean": 1.0, "balanced_accuracy_sd": 0.0}, {"groups": ["demographics"], "model": "Gradient boosting", "auc_mean": 0.599, "auc_sd": 0.049, "balanced_accuracy_mean": 0.526, "balanced_accuracy_sd": 0.018}], "learned_model": {"fitted_on_rows": 975, "items": [{"item": 1, "name": "Responds to name", "weight": 2.462}, {"item": 2, "name": "Eye contact", "weight": 2.957}, {"item": 3, "name": "Points to request", "weight": 2.304}, {"item": 4, "name": "Points to share interest", "weight": 2.58}, {"item": 5, "name": "Pretend play", "weight": 2.601}, {"item": 6, "name": "Follows gaze", "weight": 2.604}, {"item": 7, "name": "Comforts others", "weight": 2.697}, {"item": 8, "name": "First words", "weight": 2.71}, {"item": 9, "name": "Simple gestures", "weight": 2.935}, {"item": 10, "name": "Stares at nothing", "weight": 2.423}], "intercept": -9.022, "mean_weight": 2.627, "weight_variation_pct": 7.5, "threshold_in_points": 3.43}}''')
# --- END RESEARCH DATA ---


@app.get("/api/research")
def research():
    path = Path(__file__).with_name("research_results.json")
    try:
        return json.loads(path.read_text())
    except OSError:
        return RESEARCH_FALLBACK
