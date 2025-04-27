
from fastapi import FastAPI, Request, HTTPException
from .ocr_engine import OCREngine
from .image_utils import decode_base64_image

def register_routes(app: FastAPI):
    """Register all API routes"""
    
    @app.post("/ocr")
    async def ocr_endpoint(request: Request):
        """Direct OCR endpoint for frontend integration"""
        try:
            print("Received request to /ocr endpoint")
            body = await request.json()
            base64_image = body.get("base64Image", "")
            
            if not base64_image:
                print("Missing base64Image field in request")
                raise HTTPException(
                    status_code=400,
                    detail="Missing base64Image field"
                )
            
            # Decode image
            image = decode_base64_image(base64_image)
            
            # Process with OCR
            result = await OCREngine.process_image(
                image,
                ["en", "de"],
                0.4
            )
            
            # Extract all text for simplified response
            all_text = " ".join(r["text"] for r in result["results"])
            print(f"OCR processing successful, extracted text: {all_text}")
            
            return {
                "text": all_text,
                "confidence": result["confidence"],
                "boxes": result["results"]
            }
            
        except Exception as e:
            print(f"Error in OCR endpoint: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"OCR processing error: {str(e)}"
            )

    @app.options("/ocr")
    async def preflight_ocr():
        """Handle preflight CORS requests"""
        return {}

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {"status": "ok", "version": "1.0.0"}

