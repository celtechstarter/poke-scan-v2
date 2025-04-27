
// Common OCR error corrections for Pokemon cards
export const OCR_CORRECTIONS: Record<string, string> = {
  // Digits and letters often confused by EasyOCR
  '0': 'O',
  'O': '0',
  'l': '1',
  'I': '1',
  '1': 'I',
  '5': 'S',
  'S': '5',
  'Z': '2',
  '2': 'Z',
  'G': '6',
  '6': 'G',
  'B': '8',
  '8': 'B',
  // EasyOCR specific mistakes
  'rn': 'm',
  'vv': 'w',
  'VV': 'W',
  'cl': 'd',
  'ii': 'u'
};
