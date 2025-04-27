
import base64
from io import BytesIO
from PIL import Image
from fastapi import HTTPException

def decode_base64_image(image_data: str) -> Image.Image:
    """Decode a base64 string into a PIL Image"""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
        
        # Decode base64 to image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
    except Exception as e:
        print(f"Image decode error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image data: {str(e)}"
        )

