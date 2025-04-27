
import os
import uvicorn
from src.ocr_server import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting EasyOCR server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)

