import { createWorker } from 'tesseract.js';

export async function readMedicineLabel(file, onProgress = () => {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please choose a medicine photo.');
  }

  const worker = await createWorker('eng+msa', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress(Math.round((message.progress || 0) * 100));
      }
    },
  });

  try {
    const result = await worker.recognize(file);
    return result.data.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } finally {
    await worker.terminate();
  }
}

export function extractMedicineDetails(lines) {
  const cleanLines = lines.map((line) => line.trim()).filter(Boolean);
  const text = cleanLines.join('\n');
  const lower = text.toLowerCase();

  // 1. Extract Medicine Name
  let name = '';
  const mainDrugLine = cleanLines.find((line) => {
    const isHeader = /klinik|kaunter|farmasi|tel:|rm\d|kke\d|batch|expiry|harga/i.test(line);
    const isInstruction = /ambil|sebelik|sebelum|selepas|makan|kunyah|hancurkan|jauhi|kanak/i.test(line);
    const isIndication = /angina|hypertension|diabetes|asthma|gout|fever/i.test(line);
    
    return !isHeader && !isInstruction && !isIndication && /\b(\d+\s*(?:mg|mcg|g|ml)|tab|tablet|capsule)\b/i.test(line);
  });

  if (mainDrugLine) {
    name = mainDrugLine
      .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)\b.*/i, '')
      .replace(/\b(?:tab|tablet|tablets|kapsul|capsule)\b.*/i, '')
      .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
      .trim();
  } else {
    const candidate = cleanLines.find((line) => 
      !/klinik|kaunter|farmasi|tel:|kke\d|ambil|sebelum|selepas|makan|jauhi|kanak|angina|hari|biji|rm/i.test(line) &&
      /[a-zA-Z]{4,}/.test(line)
    );
    if (candidate) name = candidate.trim();
  }

  // 2. Extract Dose / Strength (e.g. 10mg)
  let doseStrength = '';
  const doseMatch = text.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))\b/i);
  if (doseMatch) {
    doseStrength = doseMatch[1];
  }

  // 3. Extract Quantity per dose (e.g. 1 biji)
  let count = '1';
  const doseCountMatch = text.match(/ambil\s*(\d+)\s*biji/i) || text.match(/(\d+)\s*(?:biji|tablet|kapsul)\s*(?:kali|sehari)/i);
  if (doseCountMatch) {
    count = doseCountMatch[1];
  }

  // 4. Extract Times per day (Frequency)
  let frequency = 1;
  const freqMatch = text.match(/(\d+)\s*kali\s*sehari/i) || text.match(/(\d+)\s*times?\s*(?:daily|a day)/i);
  if (freqMatch) {
    frequency = Math.max(1, parseInt(freqMatch[1], 10));
  } else if (/sekali\s*sehari|once\s*daily/i.test(lower)) {
    frequency = 1;
  } else if (/dua\s*kali|twice/i.test(lower)) {
    frequency = 2;
  } else if (/tiga\s*kali|three\s*times/i.test(lower)) {
    frequency = 3;
  }

  // 5. Extract How to take (Text phrase)
  let howToTake = '';
  if (/sebelum\s*makan|before\s*food/i.test(lower)) {
    howToTake = 'Sebelum makan';
  } else if (/selepas\s*makan|after\s*food/i.test(lower)) {
    howToTake = 'Selepas makan';
  } else if (/kunyah|hancurkan/i.test(lower)) {
    howToTake = 'Kunyah / Hancurkan ubat';
  }

  // 6. Generate alarm slots based on frequency count
  const defaultSlots = ['08:00', '13:00', '19:00', '22:00'];
  const finalTimes = defaultSlots.slice(0, frequency);

  return {
    name: name || '',
    doseStrength,
    count,
    frequency,
    howToTake,
    times: finalTimes,
    rawText: text,
  };
}