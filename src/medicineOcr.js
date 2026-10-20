
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
  const text = lines.join('\n');

  // Look for common English and Malay dose instructions.
  const doseMatch = text.match(
    /(?:ambil|take)\s*(\d+(?:\.\d+)?)\s*(biji|tablet|tablets|kapsul|capsule|capsules|ml)/i
  );

  const frequencyMatch = text.match(
    /(\d+)\s*kali\s*sehari|(\d+)\s+times?\s+(?:daily|a day|per day)/i
  );

  let howToTake = '';

  if (/sebelum makan|before food|before meals/i.test(text)) {
    howToTake = 'Before food';
  } else if (/selepas makan|selepas makanan|after food|after meals/i.test(text)) {
    howToTake = 'After food';
  }

  // Suggest a likely medicine-name line for caregiver review.
  const nameLine = lines.find((line) =>
    /\b(tab|tablet|capsule|cap|mg|mcg|ml)\b/i.test(line)
  );

  return {
    name: nameLine || '',
    dose: doseMatch
      ? `${doseMatch[1]} ${doseMatch[2]}`
      : '',
    frequency: frequencyMatch
      ? Number(frequencyMatch[1] || frequencyMatch[2])
      : '',
    howToTake,
  };
}
