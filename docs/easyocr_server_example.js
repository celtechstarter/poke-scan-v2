
// Example Express.js API server for EasyOCR
// This is a reference file - not part of the build
// Install with: npm install express cors
// Requires Python with easyocr installed: pip install easyocr

const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OCR endpoint
app.post('/api/ocr', async (req, res) => {
  try {
    const { image, languages = ['en'] } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Save base64 to temp file
    const imageBuffer = Buffer.from(image, 'base64');
    const tempFilePath = `/tmp/temp_image_${Date.now()}.png`;
    require('fs').writeFileSync(tempFilePath, imageBuffer);
    
    // Call Python script with EasyOCR
    const python = spawn('python3', [
      '-c',
      `
import sys
import json
import easyocr
import numpy as np
from PIL import Image

# Load image
image_path = sys.argv[1]
languages = sys.argv[2].split(',')

# Initialize reader
reader = easyocr.Reader(languages, gpu=False)

# Read text
results = reader.readtext(image_path)

# Format results
formatted_results = []
full_text = []
total_confidence = 0

for bbox, text, confidence in results:
    full_text.append(text)
    total_confidence += confidence
    top_left, top_right, bottom_right, bottom_left = bbox
    formatted_results.append({
        'text': text,
        'confidence': float(confidence),
        'x': int(top_left[0]),
        'y': int(top_left[1]),
        'width': int(bottom_right[0] - top_left[0]),
        'height': int(bottom_right[1] - top_left[1])
    })

avg_confidence = total_confidence / len(results) if results else 0

# Return results
print(json.dumps({
    'text': ' '.join(full_text),
    'confidence': float(avg_confidence),
    'boxes': formatted_results
}))
      `,
      tempFilePath,
      languages.join(',')
    ]);
    
    let result = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });
    
    python.on('close', (code) => {
      // Clean up temp file
      require('fs').unlinkSync(tempFilePath);
      
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        return res.status(500).json({ error: 'OCR processing failed' });
      }
      
      try {
        const jsonResult = JSON.parse(result);
        return res.json(jsonResult);
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        return res.status(500).json({ error: 'Failed to parse OCR result' });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`EasyOCR API server running on port ${port}`);
});

// To start: node easyocr_server.js
