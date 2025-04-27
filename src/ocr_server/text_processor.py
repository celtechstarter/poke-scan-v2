
from typing import List, Dict

class TextProcessor:
    """Handles text processing and cleanup of OCR results"""
    
    @staticmethod
    def process_text(text_results: List[tuple]) -> List[str]:
        """Process and clean raw OCR text results"""
        return [text for _, text, _ in text_results if text.strip()]
    
    @staticmethod
    def combine_text(text_list: List[str]) -> str:
        """Combine multiple text segments into a single string"""
        return " ".join(text_list)
    
    @staticmethod
    def filter_by_confidence(results: List[tuple], min_confidence: float) -> List[tuple]:
        """Filter OCR results based on confidence threshold"""
        return [result for result in results if result[2] >= min_confidence]

