"""
Leakage check on the public "Toddler Autism dataset July 2018" (Q-CHAT-10, n=1,054).

Usage:  python evaluate.py "Toddler Autism dataset July 2018.csv"
Writes: ../api/research_results.json

The dataset is not redistributed here. It was published by F. Thabtah (2018),
collected with the ASDTests app; the label "Class/ASD Traits" is assigned when
the Q-CHAT-10 score is greater than 3.
"""
import json, sys
import numpy as np, pandas as pd
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline

d = pd.read_csv(sys.argv[1])
items = [f"A{i}" for i in range(1, 11)]
y_all = (d["Class/ASD Traits"].str.strip() == "Yes").astype(int)
score = d[items].sum(axis=1)

rule_agreement = float(((score > 3).astype(int) == y_all).mean())
score_matches_column = float((score == d["Qchat-10-Score"]).mean())

demo_cat = ["Sex", "Ethnicity", "Jaundice", "Family_mem_with_ASD", "Who completed the test"]
d["Ethnicity"] = d["Ethnicity"].str.strip().str.lower()
X = d[items + ["Age_Mons"] + demo_cat].copy()
keep = ~X.assign(_y=y_all).duplicated()
X, y = X[keep], y_all[keep]

cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=0)

def run(name, cols, cat, model):
    pre = ColumnTransformer(
        [("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat)],
        remainder="passthrough")
    r = cross_validate(make_pipeline(pre, model), X[cols], y, cv=cv,
                       scoring=["roc_auc", "balanced_accuracy"])
    auc, bal = r["test_roc_auc"], r["test_balanced_accuracy"]
    return {"model": name, "features": cols,
            "auc_mean": round(float(auc.mean()), 3), "auc_sd": round(float(auc.std()), 3),
            "balanced_accuracy_mean": round(float(bal.mean()), 3),
            "balanced_accuracy_sd": round(float(bal.std()), 3)}

results = [
    run("Logistic regression - 10 questionnaire items", items, [], LogisticRegression(max_iter=2000)),
    run("Logistic regression - demographics only", ["Age_Mons"] + demo_cat, demo_cat, LogisticRegression(max_iter=2000)),
    run("Gradient boosting - demographics only", ["Age_Mons"] + demo_cat, demo_cat, HistGradientBoostingClassifier(max_depth=3, random_state=0)),
]

out = {
    "dataset": "Toddler Autism dataset July 2018 (Q-CHAT-10), F. Thabtah, 2018",
    "n_rows": int(len(d)), "n_after_dedup": int(len(X)),
    "positive_rate_after_dedup": round(float(y.mean()), 3),
    "label_equals_score_gt_3": rule_agreement,
    "score_column_equals_item_sum": score_matches_column,
    "evaluation": "5-fold stratified cross-validation repeated 5 times, after removing duplicate rows",
    "results": results,
}
json.dump(out, open(sys.argv[2] if len(sys.argv) > 2 else "../api/research_results.json", "w"), indent=2)
print(json.dumps(out, indent=2))
