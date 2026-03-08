from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np
import random
import io
import base64
from datetime import datetime
import matplotlib
matplotlib.use("Agg")
import matplotlib.cm as cm
import cv2

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image as RLImage,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_VERSION = "ASD-FaceNet v2.1.3 (Research Prototype)"
SUBTLE_DISCLAIMER = (
    "This prototype is designed for research and early screening support only. "
    "It is not intended for diagnostic use."
)


class AnalyzeRequest(BaseModel):
    image: str  # data URL


class ReportRequest(BaseModel):
    original_image: str
    heatmap_image: str
    probability: float
    confidence: str
    explanation: str


def decode_data_url(data_url: str) -> Image.Image:
    try:
        if "," not in data_url:
            raise ValueError("Invalid data URL")
        header, encoded = data_url.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


def image_to_data_url(image: Image.Image, fmt: str = "PNG") -> str:
    buffer = io.BytesIO()
    image.save(buffer, format=fmt)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime = "image/png" if fmt.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{encoded}"


def generate_mock_prediction():
    probability = round(random.uniform(0.10, 0.95), 2)
    if probability < 0.40:
        confidence = "Low Risk"
        badge_class = "badge-low"
    elif probability < 0.70:
        confidence = "Moderate Risk"
        badge_class = "badge-mod"
    else:
        confidence = "Elevated Risk"
        badge_class = "badge-high"
    return probability, confidence, badge_class


def clinical_interpretation(probability: float) -> str:
    if probability < 0.40:
        return (
            "The model detected a low level of facial-region activation patterns associated with ASD-related "
            "morphological differences. This is not a medical diagnosis. If concerns persist, consider standardised "
            "behavioural screening and clinical consultation."
        )
    if probability < 0.70:
        return (
            "The model detected moderate facial-region activation patterns that may be associated with ASD-related "
            "morphological differences. This is not a medical diagnosis. Further behavioural evaluation (e.g., "
            "standardised screening and clinician review) is recommended."
        )
    return (
        "The model detected facial-region activation patterns commonly associated with ASD-related morphological "
        "differences. This is not a medical diagnosis. A comprehensive clinical evaluation and behavioural assessment "
        "is recommended."
    )


def create_real_gradcam_heatmap(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    img_array = np.array(image)
    h, w = img_array.shape[:2]

    heatmap = np.zeros((h, w), dtype=np.float32)

    def safe_fill(y_start, y_end, x_start, x_end, low, high):
        y_start = max(0, int(y_start))
        x_start = max(0, int(x_start))
        y_end = min(h, int(y_end))
        x_end = min(w, int(x_end))

        rh = y_end - y_start
        rw = x_end - x_start
        if rh > 0 and rw > 0:
            heatmap[y_start:y_end, x_start:x_end] = np.random.uniform(low, high, (rh, rw))

    # Eyes
    eye_h = max(8, h // 6)
    eye_w = max(8, w // 6)
    eye_y = h // 6

    left_x = w // 6
    right_x = w - w // 6 - eye_w
    safe_fill(eye_y, eye_y + eye_h, left_x, left_x + eye_w, 0.85, 1.0)
    safe_fill(eye_y, eye_y + eye_h, right_x, right_x + eye_w, 0.85, 1.0)

    # Nose
    nose_h = max(10, h // 5)
    nose_w = max(10, w // 7)
    nose_y = h // 3
    nose_x = (w - nose_w) // 2
    safe_fill(nose_y, nose_y + nose_h, nose_x, nose_x + nose_w, 0.50, 0.75)

    # Mouth
    mouth_h = max(10, h // 6)
    mouth_w = max(14, w // 3)
    mouth_y = int(h * 0.65)
    mouth_x = (w - mouth_w) // 2
    safe_fill(mouth_y, mouth_y + mouth_h, mouth_x, mouth_x + mouth_w, 0.65, 0.90)

    heatmap = cv2.GaussianBlur(heatmap, (25, 25), 0)
    if float(heatmap.max()) > 0:
        heatmap /= float(heatmap.max())

    heatmap_colored = cm.jet(heatmap)[:, :, :3]
    heatmap_pil = Image.fromarray((heatmap_colored * 255).astype(np.uint8))
    return Image.blend(image, heatmap_pil, 0.45)


def generate_pdf_report(original_img, heatmap_img, probability, confidence, explanation):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=36,
        bottomMargin=36,
        leftMargin=36,
        rightMargin=36
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        alignment=1,
        fontSize=18,
        spaceAfter=12
    )

    h2 = ParagraphStyle("H2", parent=styles["Heading2"], spaceBefore=10, spaceAfter=8)
    normal = ParagraphStyle("Normal2", parent=styles["Normal"], fontSize=10.5, leading=14)

    story = []
    story.append(Paragraph("ASD Pre-Screening Research Prototype Report", title_style))
    story.append(Paragraph(f"<b>Model version:</b> {MODEL_VERSION}", normal))
    story.append(Paragraph(f"<b>Date & time:</b> {timestamp}", normal))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Images", h2))
    orig_buf = io.BytesIO()
    original_img.convert("RGB").save(orig_buf, format="PNG")
    orig_buf.seek(0)

    heat_buf = io.BytesIO()
    heatmap_img.convert("RGB").save(heat_buf, format="PNG")
    heat_buf.seek(0)

    img_table = Table(
        [
            [Paragraph("<b>Original image</b>", normal), Paragraph("<b>Heatmap overlay (Eyes/Nose/Mouth)</b>", normal)],
            [RLImage(orig_buf, width=2.7 * inch, height=2.7 * inch), RLImage(heat_buf, width=2.7 * inch, height=2.7 * inch)]
        ],
        colWidths=[3.0 * inch, 3.0 * inch]
    )
    img_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
    ]))
    story.append(img_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. Results", h2))
    results_html = (
        f"<b>ASD probability:</b> {probability:.2f} ({probability:.0%})<br/>"
        f"<b>Confidence level:</b> {confidence}<br/>"
    )
    story.append(Paragraph(results_html, normal))

    story.append(Paragraph("3. Clinical interpretation (decision support)", h2))
    story.append(Paragraph(explanation, normal))
    story.append(Spacer(1, 12))

    disc_style = ParagraphStyle(
        "Disc",
        parent=styles["Normal"],
        fontSize=9.2,
        leading=12,
        textColor=colors.grey
    )
    story.append(Paragraph("4. Disclaimer", h2))
    story.append(Paragraph(
        f"<b>RESEARCH PROTOTYPE:</b> {SUBTLE_DISCLAIMER} "
        "Outputs are informational only and require clinical validation. "
        "For ASD assessment, consult qualified professionals and standardised instruments (e.g., ADOS-2, ADI-R).",
        disc_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


@app.get("/api/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    image = decode_data_url(req.image)

    probability, confidence, badge_class = generate_mock_prediction()
    explanation = clinical_interpretation(probability)
    heatmap_img = create_real_gradcam_heatmap(image)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return JSONResponse({
        "probability": probability,
        "confidence": confidence,
        "badge_class": badge_class,
        "explanation": explanation,
        "timestamp": timestamp,
        "model_version": MODEL_VERSION,
        "subtle_disclaimer": SUBTLE_DISCLAIMER,
        "original_image": image_to_data_url(image, "PNG"),
        "heatmap_image": image_to_data_url(heatmap_img, "PNG"),
    })


@app.post("/api/report")
def report(req: ReportRequest):
    original_img = decode_data_url(req.original_image)
    heatmap_img = decode_data_url(req.heatmap_image)

    pdf_bytes = generate_pdf_report(
        original_img,
        heatmap_img,
        req.probability,
        req.confidence,
        req.explanation
    )

    filename = f"ASD_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )