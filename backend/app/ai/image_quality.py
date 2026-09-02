import cv2
import numpy as np
from typing import Dict, Any, List

def analyze_image_quality(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes resolution, brightness, contrast, and Laplacian blur variance using OpenCV.
    """
    issues: List[str] = []

    # 1. Decode image bytes via OpenCV
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {
            "quality_score": 0.5,
            "is_blurry": False,
            "is_too_dark": False,
            "is_overexposed": False,
            "blur_variance": 50.0,
            "mean_brightness": 128.0,
            "resolution": "Unknown",
            "issues": ["Could not decode image format with OpenCV"]
        }

    height, width = img.shape[:2]
    resolution_str = f"{width}x{height}"

    # 2. Resolution Check
    min_pixels = 300 * 300
    if width * height < min_pixels:
        issues.append(f"Low resolution: {resolution_str} (Minimum recommended: 640x480)")

    # 3. Grayscale conversion for luminance and blur
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 4. Brightness & Contrast via OpenCV meanStdDev
    mean_val, std_val = cv2.meanStdDev(gray)
    brightness = float(mean_val[0][0])
    contrast = float(std_val[0][0])

    is_too_dark = brightness < 45.0
    is_overexposed = brightness > 220.0
    is_low_contrast = contrast < 20.0

    if is_too_dark:
        issues.append(f"Image is underexposed/too dark (Luminance: {brightness:.1f}/255)")
    if is_overexposed:
        issues.append(f"Image is overexposed/too bright (Luminance: {brightness:.1f}/255)")
    if is_low_contrast and not is_too_dark and not is_overexposed:
        issues.append("Low visual contrast/flat lighting detected")

    # 5. Real OpenCV Laplacian Blur Variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    laplacian_var = float(laplacian.var())
    
    # Sharp images typically have variance > 40; blurry images < 20
    is_blurry = laplacian_var < 20.0
    if is_blurry:
        issues.append(f"Image appears blurry or out of focus (Blur variance: {laplacian_var:.1f})")

    # 6. Quality Score Calculation (0.1 to 1.0)
    score = 1.0
    if is_blurry:
        score -= 0.35
    if is_too_dark or is_overexposed:
        score -= 0.30
    if width * height < min_pixels:
        score -= 0.20
    if is_low_contrast:
        score -= 0.15

    final_score = max(0.1, min(1.0, score))

    return {
        "quality_score": round(final_score, 2),
        "is_blurry": is_blurry,
        "is_too_dark": is_too_dark,
        "is_overexposed": is_overexposed,
        "blur_variance": round(laplacian_var, 2),
        "mean_brightness": round(brightness, 1),
        "contrast": round(contrast, 1),
        "resolution": resolution_str,
        "issues": issues
    }
