from typing import Dict, Any, List

def calculate_evidence_trust_score(
    location_verified: bool,
    gps_accuracy: float,
    quality_score: float,
    quality_issues: List[str],
    is_exact_duplicate: bool,
    is_near_duplicate: bool,
    ai_confidence: float,
    has_category: bool
) -> Dict[str, Any]:
    """
    Computes a hybrid multi-signal Evidence Trust Score (0-100).
    """
    score = 0
    issues = []

    # 1. Location Verification (+30 max)
    if location_verified:
        score += 30
    else:
        issues.append("Location Verification Failed: Outside project geofence perimeter")

    # 2. GPS Accuracy (+10 max)
    if gps_accuracy is not None:
        if gps_accuracy <= 20:
            score += 10
        elif gps_accuracy <= 50:
            score += 6
        else:
            score += 2
            issues.append(f"Low GPS Accuracy ({gps_accuracy}m)")
    else:
        score += 5

    # 3. Image Quality (+20 max)
    quality_points = int(quality_score * 20)
    score += quality_points
    if quality_issues:
        issues.extend(quality_issues)

    # 4. Duplicate Absence (+20 max)
    if is_exact_duplicate:
        issues.append("Exact Duplicate Image detected (SHA-256 match with previous record)")
        score -= 25
    elif is_near_duplicate:
        issues.append("High Near-Duplicate Risk (Perceptual Hash match)")
        score += 5
    else:
        score += 20

    # 5. Category Adherence (+10 max)
    if has_category:
        score += 10

    # 6. AI Stage Confidence (+10 max)
    score += int(ai_confidence * 10)

    final_score = max(0, min(100, score))

    # Trust Status categorization
    if final_score >= 80 and not is_exact_duplicate and location_verified:
        trust_status = "HIGH CONFIDENCE"
    elif final_score >= 50:
        trust_status = "NEEDS REVIEW"
    else:
        trust_status = "SUSPICIOUS"

    return {
        "trust_score": final_score,
        "trust_status": trust_status,
        "issues": issues
    }
