
from typing import List, Dict

class ConfidenceProcessor:
    """Handles confidence score calculations and analysis"""
    
    @staticmethod
    def calculate_average_confidence(results: List[Dict]) -> float:
        """Calculate average confidence score from results"""
        if not results:
            return 0.0
            
        total_confidence = sum(result["confidence"] for result in results)
        return total_confidence / len(results)
    
    @staticmethod
    def get_confidence_stats(results: List[Dict]) -> Dict[str, float]:
        """Get detailed confidence statistics"""
        if not results:
            return {"average": 0.0, "min": 0.0, "max": 0.0}
            
        confidences = [r["confidence"] for r in results]
        return {
            "average": sum(confidences) / len(confidences),
            "min": min(confidences),
            "max": max(confidences)
        }

