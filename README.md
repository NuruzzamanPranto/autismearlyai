# AutismEarlyAI — Research Interface Prototype

**Current status (November 2026): Interface prototype only. No trained autism prediction model is connected.**

AutismEarlyAI demonstrates software interfaces and workflows for a proposed autism-related machine-learning research program. **It is not an autism screening tool, diagnostic device, validated risk estimator, or clinical decision-support system.** Do not use it to make health decisions or process real patient information.

## What is implemented

- Web interface for image selection and camera preview
- FastAPI backend and image-processing demonstration code
- PDF reporting workflow
- Prototype visual overlays for demonstrating user-interface concepts

## Important technical limitations

- The backend's existing prediction function generates **random demonstration numbers**, not model inference. Such numbers are **not probabilities of autism**.
- Existing visual overlays use programmatically selected image regions and randomness; they are **not Grad-CAM explanations of a trained model**.
- No trained model weights, verified evaluation dataset, validated performance metrics, or clinical deployment are demonstrated in this repository.
- The demonstration login is not production authentication; do not upload sensitive or identifiable images.
- Legacy backend endpoints may still produce simulated output. They must not be exposed or used for health assessment. Frontend analysis has been disabled pending backend remediation.

## Research direction (planned, not implemented here)

The proposed research aims to study leakage-controlled evaluation, robustness, calibration, subgroup fairness, and transparent reporting of machine-learning methods relevant to early autism screening and referral research. Such research would require appropriate datasets, permissions, documented experiments, independent validation, and clinical oversight before any practical use could be considered.

## Historical record and corrections

This README corrects earlier descriptions that implied a functioning or deployed AI screening model. Historical commits remain available in Git history; this clarification does not retroactively change what was implemented at earlier dates.

Project website: https://www.autismearlyai.org/

**No clinical or diagnostic use.**
