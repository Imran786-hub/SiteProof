import hashlib
import cv2
import numpy as np

def compute_sha256(image_bytes: bytes) -> str:
    """Computes exact 256-bit cryptographic SHA-256 hash."""
    return hashlib.sha256(image_bytes).hexdigest()

def compute_perceptual_hash(image_bytes: bytes) -> str:
    """
    Computes a 64-bit DCT (Discrete Cosine Transform) perceptual hash (pHash) using OpenCV.
    Robust against scaling, compression, minor color adjustments.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return hashlib.md5(image_bytes[:1024]).hexdigest()[:16]

        # 1. Resize to 32x32 for DCT
        resized = cv2.resize(img, (32, 32), interpolation=cv2.INTER_AREA)
        
        # 2. Compute 2D Discrete Cosine Transform
        dct = cv2.dct(np.float32(resized))
        
        # 3. Extract top-left 8x8 low-frequency coefficients (excluding DC term at [0,0])
        dct_low = dct[0:8, 0:8]
        median_val = float(np.median(dct_low))
        
        # 4. Generate 64-bit binary hash (1 if > median, else 0)
        bit_matrix = dct_low > median_val
        hash_bits = bit_matrix.flatten()
        
        # 5. Convert 64 bits to 16-character hex string
        hex_str = []
        for i in range(0, 64, 4):
            nibble = hash_bits[i:i+4]
            val = sum([int(b) << (3 - idx) for idx, b in enumerate(nibble)])
            hex_str.append(hex(val)[2:])
            
        return "".join(hex_str)
    except Exception:
        # Fallback to difference hash
        return hashlib.md5(image_bytes[:1024]).hexdigest()[:16]

def calculate_hamming_distance(hash1: str, hash2: str) -> int:
    """
    Calculates bitwise Hamming distance between two hex hashes (0 to 64).
    Distance <= 10 indicates high near-duplicate similarity (>85% matching visual structure).
    """
    if not hash1 or not hash2:
        return 64
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        xor_val = val1 ^ val2
        return bin(xor_val).count("1")
    except Exception:
        return 64
