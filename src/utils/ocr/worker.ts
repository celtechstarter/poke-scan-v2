
import { createWorker, PSM } from 'tesseract.js';

/**
 * Creates and initializes a Tesseract worker optimized for Pokémon card text
 * Now using both German and English languages for better mixed text recognition
 * With enhanced configuration for high confidence text extraction
 */
export const initOcrWorker = async () => {
  const worker = await createWorker('deu+eng', 1, {
    logger: import.meta.env.DEV 
      ? m => console.log(m) 
      : undefined
  });
  
  await worker.setParameters({
    preserve_interword_spaces: '1',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/. äöüÄÖÜß',
    tessedit_pageseg_mode: PSM.SPARSE_TEXT_OSD, // Using SPARSE_TEXT_OSD for better structure detection
    tessjs_create_hocr: '0',
    tessjs_create_tsv: '0',
    tessjs_create_box: '0',
    tessjs_create_unlv: '0',
    tessjs_create_osd: '0',
    // High confidence mode settings
    tessedit_certainty_threshold: '-50', // Higher value = only more confident results
    tessedit_reject_low_conf: '1',       // Reject low confidence results
  });
  
  return worker;
};
