
import easyocr
from typing import List, Dict
from PIL import Image
import numpy as np

class OCREngine:
    """Handles OCR processing using EasyOCR"""
    _readers: Dict[str, easyocr.Reader] = {}

    @classmethod
    def get_reader(cls, languages: List[str]) -> easyocr.Reader:
        """Get or create an EasyOCR reader for the specified languages"""
        lang_key = '-'.join(sorted(languages))
        if lang_key not in cls._readers:
            print(f"Initializing EasyOCR reader for languages: {languages}")
            cls._readers[lang_key] = easyocr.Reader(
                languages,
                gpu=False,
                download_enabled=True,
                detector=True,
                recognizer=True
            )
        return cls._readers[lang_key]

    @classmethod
    async def process_image(cls, image: Image.Image, languages: List[str], min_confidence: float = 0.4):
        """Process an image and extract text using EasyOCR"""
        # Convert PIL Image to numpy array
        img_array = np.array(image)
        
        # Get reader and perform OCR
        reader = cls.get_reader(languages)
        results = reader.readtext(img_array)
        
        # Filter and format results
        processed_results = []
        total_confidence = 0.0
        valid_results = 0
        
        for bbox, text, confidence in results:
            if confidence >= min_confidence:
                min_x = min(point[0] for point in bbox)
                min_y = min(point[1] for point in bbox)
                max_x = max(point[0] for point in bbox)
                max_y = max(point[1] for point in bbox)
                
                processed_results.append({
                    "text": text,
                    "confidence": confidence,
                    "box": {
                        "x": min_x,
                        "y": min_y,
                        "width": max_x - min_x,
                        "height": max_y - min_y
                    }
                })
                
                total_confidence += confidence
                valid_results += 1
        
        avg_confidence = total_confidence / valid_results if valid_results > 0 else 0.0
        
        return {
            "results": processed_results,
            "confidence": avg_confidence
        }

