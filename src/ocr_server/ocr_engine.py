
import easyocr
from typing import List, Dict
from PIL import Image
import numpy as np
from .text_processor import TextProcessor
from .bbox_processor import BBoxProcessor
from .confidence_processor import ConfidenceProcessor

class OCREngine:
    """Handles OCR processing using EasyOCR with modular processing"""
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
        raw_results = reader.readtext(img_array)
        
        # Filter results by confidence
        filtered_results = TextProcessor.filter_by_confidence(raw_results, min_confidence)
        
        # Process bounding boxes
        processed_results = BBoxProcessor.process_boxes(filtered_results)
        
        # Calculate confidence stats
        confidence_stats = ConfidenceProcessor.get_confidence_stats(processed_results)
        
        return {
            "results": processed_results,
            "confidence": confidence_stats["average"]
        }

