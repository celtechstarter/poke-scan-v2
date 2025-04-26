
import { createWorker, PSM } from 'tesseract.js';

/**
 * Creates and initializes a Tesseract worker optimized for Pokémon card text
 * Now using both German and English languages for better mixed text recognition
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
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    tessjs_create_hocr: '0',
    tessjs_create_tsv: '0',
    tessjs_create_box: '0',
    tessjs_create_unlv: '0',
    tessjs_create_osd: '0',
  });
  
  return worker;
};
