
import base64
import io
import os
import time
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import easyocr

# Initialize FastAPI app
app = FastAPI(
    title="EasyOCR API for Pokémon Card OCR",
    description="A REST API that processes images and extracts text using EasyOCR",
    version="1.0.0"
)

# Configure CORS to allow requests from any origin (crucial for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins including localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR reader - lazy loading on first request
readers = {}

def get_reader(languages: List[str]) -> easyocr.Reader:
    """Get or create an EasyOCR reader for the specified languages"""
    lang_key = '-'.join(sorted(languages))
    if lang_key not in readers:
        print(f"Initializing EasyOCR reader for languages: {languages}")
        readers[lang_key] = easyocr.Reader(
            languages,
            gpu=False,  # Set to True if GPU is available
            download_enabled=True,
            detector=True,
            recognizer=True
        )
    return readers[lang_key]

# Define request model
class OCRRequest(BaseModel):
    image: str
    languages: List[str] = ["en", "de"]
    min_confidence: float = 0.4

# Define response models
class DetectedBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    text: str
    confidence: float

class OCRResponse(BaseModel):
    text: str
    confidence: float
    boxes: List[DetectedBox] = []
    processing_time: float

async def process_image(
    image_data: str,
    languages: List[str],
    min_confidence: float
) -> OCRResponse:
    """Process an image with EasyOCR and return the extracted text"""
    try:
        start_time = time.time()
        
        # Convert base64 to image
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert PIL Image to numpy array for EasyOCR
            img_array = np.array(image)
        except Exception as e:
            print(f"Image decode error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image data: {str(e)}"
            )
        
        # Get reader for languages
        reader = get_reader(languages)
        
        # Perform OCR
        results = reader.readtext(img_array)
        
        # Extract and format results
        all_text = []
        boxes = []
        total_confidence = 0.0
        valid_results = 0
        
        for (bbox, text, confidence) in results:
            if confidence >= min_confidence:
                all_text.append(text)
                
                # Calculate box dimensions
                min_x = min(point[0] for point in bbox)
                min_y = min(point[1] for point in bbox)
                max_x = max(point[0] for point in bbox)
                max_y = max(point[1] for point in bbox)
                width = max_x - min_x
                height = max_y - min_y
                
                boxes.append(DetectedBox(
                    x=min_x,
                    y=min_y,
                    width=width,
                    height=height,
                    text=text,
                    confidence=confidence
                ))
                
                total_confidence += confidence
                valid_results += 1
        
        # Calculate average confidence
        avg_confidence = total_confidence / valid_results if valid_results > 0 else 0.0
        
        # Build response
        return OCRResponse(
            text=" ".join(all_text),
            confidence=avg_confidence,
            boxes=boxes,
            processing_time=time.time() - start_time
        )
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing error: {str(e)}"
        )

@app.post("/", response_model=OCRResponse)
async def ocr_root(request: OCRRequest, background_tasks: BackgroundTasks):
    """Root endpoint for backward compatibility"""
    return await process_image(
        request.image,
        request.languages,
        request.min_confidence
    )

@app.post("/api/ocr", response_model=OCRResponse)
async def ocr(request: OCRRequest, background_tasks: BackgroundTasks):
    """
    Extract text from an image using EasyOCR
    
    - **image**: Base64 encoded image with or without data URL prefix
    - **languages**: List of language codes to use for OCR (default: ["en", "de"])
    - **min_confidence**: Minimum confidence threshold for results (default: 0.4)
    """
    if not request.image:
        raise HTTPException(
            status_code=400,
            detail="Missing image data"
        )
    
    # Process the image
    return await process_image(
        request.image,
        request.languages,
        request.min_confidence
    )

@app.post("/ocr")
async def ocr_direct(request: Request):
    """
    Direct OCR endpoint for simpler frontend integration
    Accepts JSON with base64Image field
    """
    try:
        print("Received request to /ocr endpoint")
        # Parse the request body
        body = await request.json()
        base64_image = body.get("base64Image", "")
        
        if not base64_image:
            print("Missing base64Image field in request")
            raise HTTPException(
                status_code=400,
                detail="Missing base64Image field"
            )
        
        # Use the existing processing logic
        result = await process_image(
            base64_image,
            ["en", "de"],  # Default languages
            0.4  # Default confidence
        )
        
        print(f"OCR processing successful, extracted text: {result.text}")
        
        # Return a simplified response format
        return {
            "text": result.text,
            "confidence": result.confidence,
            "boxes": [box.dict() for box in result.boxes]
        }
    except Exception as e:
        print(f"Error in direct OCR endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing error: {str(e)}"
        )

@app.options("/ocr")
async def preflight_ocr():
    """Handle preflight CORS requests for /ocr endpoint"""
    return {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}

# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting EasyOCR server on port {port}")
    uvicorn.run("easyocr_server:app", host="0.0.0.0", port=port, reload=False)
