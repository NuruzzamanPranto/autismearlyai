# AutismEarlyAI — Interface Prototype

> **Status: interface prototype. No trained AI model is connected.**
> This site does not analyse images and does not produce autism risk scores. It is not a medical device and must not be used for screening or diagnosis.

## What this repository is

This repository contains the front-end and a minimal back-end for a **planned user interface** for research on explainable early-autism-screening tools: image input screens, a results layout, and a report layout.

## Correction to earlier versions

Earlier versions of this repository and of autismearlyai.org displayed **simulated outputs** to demonstrate the interface:

- the "ASD probability" was a **randomly generated number** (`generate_mock_prediction`), not a model prediction;
- the "Grad-CAM heatmap" was an **illustrative overlay** drawn over fixed eye/nose/mouth regions, not a model explanation;
- the "ASD-FaceNet v2.1.3" label did not correspond to a model included in or called by this code.

Earlier descriptions of this project as a "deployed", "real-world" AI system were inaccurate. The simulation has been removed; the analysis and report endpoints now return HTTP 503. The earlier code remains visible in the commit history.

## Where the research is

The modelling and evaluation research associated with this project — including leakage-controlled, multi-dataset evaluation of autism-screening machine learning — is reported in the author's peer-reviewed papers and manuscripts, with their own code and documented limitations. That research is separate from this interface.

## Plans

A model will only be connected to this interface after it has been trained and evaluated with leakage-controlled, multi-dataset and subgroup analyses, with its performance and limitations documented here. Any use involving real children's data would require appropriate ethics/IRB oversight and consent.

## Developer

Md Nuruzzaman Pranto
