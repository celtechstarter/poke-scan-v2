
from typing import List, Dict, Tuple

class BBoxProcessor:
    """Handles bounding box calculations and processing"""
    
    @staticmethod
    def calculate_box_dimensions(bbox: List[List[int]]) -> Dict[str, float]:
        """Calculate dimensions from bounding box coordinates"""
        min_x = min(point[0] for point in bbox)
        min_y = min(point[1] for point in bbox)
        max_x = max(point[0] for point in bbox)
        max_y = max(point[1] for point in bbox)
        
        return {
            "x": min_x,
            "y": min_y,
            "width": max_x - min_x,
            "height": max_y - min_y
        }
    
    @staticmethod
    def process_boxes(results: List[Tuple]) -> List[Dict]:
        """Process all bounding boxes from OCR results"""
        processed_boxes = []
        
        for bbox, text, confidence in results:
            box_dims = BBoxProcessor.calculate_box_dimensions(bbox)
            processed_boxes.append({
                "text": text,
                "confidence": confidence,
                "box": box_dims
            })
        
        return processed_boxes

