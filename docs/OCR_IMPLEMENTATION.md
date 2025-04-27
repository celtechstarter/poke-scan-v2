
# Pokémon Card OCR Implementation

This document explains how the OCR system for the Pokémon card scanner works.

## Architecture

The OCR system uses EasyOCR for text recognition with a multi-stage processing pipeline:

1. **Image Preprocessing**: Enhances card images for optimal text recognition
2. **Region-based Scanning**: Processes specific card regions for better results
3. **Post-processing**: Cleans and validates the OCR results

## EasyOCR Integration

The system is designed to work with an EasyOCR backend API:

- Frontend sends base64 images to the API endpoint
- EasyOCR processes the image and returns recognized text
- Results are post-processed for accuracy

## Configuration

The EasyOCR endpoint can be configured through an environment variable:

```
VITE_EASY_OCR_ENDPOINT=https://your-easyocr-backend.com/api/ocr
```

If this variable is not set, the system defaults to `/api/ocr`.

## Backend Implementation

A simple Express.js server with EasyOCR can be implemented using the example in `docs/easyocr_server_example.js`.

Key requirements:
- Python with EasyOCR installed
- Node.js with Express
- Accepts POST requests with base64 image data
- Returns JSON with text, confidence, and bounding boxes

## Preprocessing Optimizations

The system applies several image enhancements optimized for EasyOCR:

- Strong contrast boost (100%)
- Aggressive unsharp mask (factor 2.5-3.0)
- Adaptive binary thresholding
- Optional color inversion

## Fallback Strategy

If the EasyOCR server is unavailable, the system falls back to:
- Local processing mode
- User notification about limited functionality
- Database-assisted matching when possible

## Debugging

The system includes extensive logging to help with debugging:
- OCR confidence scores
- Processing steps
- Image quality assessment
- Error handling with toast notifications
