
import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import base64
from io import BytesIO
from PIL import Image
import numpy as np

# Create the FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR reader
print("Initializing EasyOCR reader...")
reader = easyocr.Reader(['en', 'de'], gpu=False)
print("EasyOCR reader initialized successfully")

@app.post("/ocr")
async def ocr_endpoint(request: Request):
    try:
        # Parse the request body
        body = await request.json()
        base64_image = body["base64Image"]
        
        # Extract the actual base64 data (remove data:image/... prefix if present)
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
            
        # Decode the base64 image
        decoded = base64.b64decode(base64_image)
        
        # Open the image with PIL
        image = Image.open(BytesIO(decoded)).convert('RGB')
        
        # Convert to numpy array for EasyOCR
        np_image = np.array(image)
        
        # Process with EasyOCR
        print("Processing image with EasyOCR...")
        result = reader.readtext(np_image, detail=0)
        full_text = ' '.join(result)
        print(f"OCR Result: {full_text}")
        
        # Return the results
        return {"text": full_text}
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting EasyOCR server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
