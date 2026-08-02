import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createCanvas, loadImage } from 'canvas';
import jsQR from 'jsqr';
import { createWorker } from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin using the new key 3543e8d9ee
const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key file not found at: ${serviceAccountPath}`);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Directory containing QR code images for Day 2
const QR_DIR = path.join(__dirname, 'qr_day_2');
const FAILED_FILE_PATH = path.join(__dirname, 'failed_files.txt');

function getThaiISOString() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thaiTime = new Date(utc + (3600000 * 7));
  const year = thaiTime.getFullYear();
  const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const day = String(thaiTime.getDate()).padStart(2, '0');
  const hours = String(thaiTime.getHours()).padStart(2, '0');
  const minutes = String(thaiTime.getMinutes()).padStart(2, '0');
  const seconds = String(thaiTime.getSeconds()).padStart(2, '0');
  const millis = String(thaiTime.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}+07:00`;
}

// Find student record in Firestore by code
async function findStudent(code) {
  const cleanCode = code.trim().toUpperCase();
  const candidateCodes = [cleanCode];

  // OCR/QR correction helper
  if (cleanCode.includes('I')) {
    candidateCodes.push(cleanCode.replace(/I/g, 'L'));
    candidateCodes.push(cleanCode.replace(/I/g, '1'));
  }
  if (cleanCode.includes('L')) {
    candidateCodes.push(cleanCode.replace(/L/g, 'I'));
    candidateCodes.push(cleanCode.replace(/L/g, '1'));
  }
  if (cleanCode.includes('1')) {
    candidateCodes.push(cleanCode.replace(/1/g, 'I'));
    candidateCodes.push(cleanCode.replace(/1/g, 'L'));
  }

  for (const candidate of candidateCodes) {
    // 1. Used short codes map
    try {
      const scDoc = await db.collection('used_short_codes').doc(candidate).get();
      if (scDoc.exists && scDoc.data()?.uid) {
        const uid = scDoc.data().uid;
        const uDoc = await db.collection('users').doc(uid).get();
        if (uDoc.exists) return { id: uDoc.id, data: uDoc.data(), matchedCode: candidate };
      }
    } catch (err) {}

    // 2. Query walkin_temp_short_code
    try {
      const q1 = await db.collection('users').where('walkin_temp_short_code', '==', candidate).limit(1).get();
      if (!q1.empty) return { id: q1.docs[0].id, data: q1.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 3. Query short_code
    try {
      const q2 = await db.collection('users').where('short_code', '==', candidate).limit(1).get();
      if (!q2.empty) return { id: q2.docs[0].id, data: q2.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 4. Query shortCode
    try {
      const q3 = await db.collection('users').where('shortCode', '==', candidate).limit(1).get();
      if (!q3.empty) return { id: q3.docs[0].id, data: q3.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 5. Query studentId
    try {
      const q4 = await db.collection('users').where('studentId', '==', candidate).limit(1).get();
      if (!q4.empty) return { id: q4.docs[0].id, data: q4.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 6. Direct docId
    try {
      const uDoc = await db.collection('users').doc(candidate).get();
      if (uDoc.exists) return { id: uDoc.id, data: uDoc.data(), matchedCode: candidate };
    } catch (err) {}
  }

  return null;
}

function parseUidFromQr(qrText) {
  if (!qrText) return null;
  const normalized = qrText.trim();

  const uidMatch = normalized.match(/U[A-Z0-9]{8,}/i);
  if (uidMatch) return uidMatch[0];

  const segments = normalized.split(/[:\/\\\s]+/).map(s => s.trim()).filter(Boolean);
  return segments.find(seg => /^U[A-Z0-9]{8,}$/i.test(seg)) || null;
}

function extractQrCandidates(qrText) {
  if (!qrText) return [];
  const normalized = qrText.toUpperCase().replace(/[^A-Z0-9]/g, ' ');
  const tokens = Array.from(new Set(normalized.split(/\s+/).filter(Boolean)));

  const candidates = [];
  for (const token of tokens) {
    if (/^[A-Z0-9]{4}$/.test(token) || /^[A-Z0-9]{5}$/.test(token)) {
      candidates.push(token);
      continue;
    }
    if (/^[A-Z0-9]{8,}$/.test(token)) {
      candidates.push(token);
    }
  }

  return candidates;
}

async function findStudentByUid(uid) {
  const cleanUid = uid.trim();
  if (!cleanUid) return null;

  const candidates = Array.from(new Set([cleanUid, cleanUid.toLowerCase(), cleanUid.toUpperCase()]));

  for (const candidate of candidates) {
    try {
      const q = await db.collection('users').where('line_uid', '==', candidate).limit(1).get();
      if (!q.empty) return { id: q.docs[0].id, data: q.docs[0].data(), matchedCode: candidate };
    } catch (err) {
      // ignore
    }

    try {
      const userDoc = await db.collection('users').doc(candidate).get();
      if (userDoc.exists) return { id: userDoc.id, data: userDoc.data(), matchedCode: candidate };
    } catch (err) {
      // ignore
    }
  }

  return null;
}

function scanCanvasForQr(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth'
  });
}

function createCanvasFromImage(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return canvas;
}

function scaleCanvas(sourceCanvas, scale) {
  const scaledCanvas = createCanvas(Math.max(1, Math.floor(sourceCanvas.width * scale)), Math.max(1, Math.floor(sourceCanvas.height * scale)));
  const ctx = scaledCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  return scaledCanvas;
}

function rotateCanvas(sourceCanvas, angle) {
  const radians = angle * Math.PI / 180;
  const rotatedCanvas = createCanvas(angle === 180 ? sourceCanvas.width : sourceCanvas.height, angle === 180 ? sourceCanvas.height : sourceCanvas.width);
  const ctx = rotatedCanvas.getContext('2d');

  if (angle === 90) ctx.translate(rotatedCanvas.width, 0);
  if (angle === 180) ctx.translate(rotatedCanvas.width, rotatedCanvas.height);
  if (angle === 270) ctx.translate(0, rotatedCanvas.height);
  ctx.rotate(radians);
  ctx.drawImage(sourceCanvas, 0, 0);

  return rotatedCanvas;
}

function cropCanvas(sourceCanvas, xFactor, yFactor, wFactor, hFactor) {
  const x = Math.floor(sourceCanvas.width * xFactor);
  const y = Math.floor(sourceCanvas.height * yFactor);
  const width = Math.floor(sourceCanvas.width * wFactor);
  const height = Math.floor(sourceCanvas.height * hFactor);
  const croppedCanvas = createCanvas(width, height);
  const ctx = croppedCanvas.getContext('2d');
  ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
  return croppedCanvas;
}

function thresholdCanvas(sourceCanvas, threshold = 128) {
  const canvas = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const value = gray >= threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function decodeQRCode(filePath) {
  try {
    const image = await loadImage(filePath);
    const originalCanvas = createCanvasFromImage(image);
    const canvases = [];

    const scales = [1, 0.75, 0.5, 0.4];
    for (const scale of scales) {
      canvases.push(scale === 1 ? originalCanvas : scaleCanvas(originalCanvas, scale));
    }

    canvases.push(cropCanvas(originalCanvas, 0.1, 0.1, 0.8, 0.8));
    canvases.push(cropCanvas(originalCanvas, 0.15, 0.2, 0.7, 0.6));
    canvases.push(cropCanvas(originalCanvas, 0.2, 0.25, 0.6, 0.5));

    let attemptIndex = 0;
    for (const canvas of canvases) {
      const variants = [canvas, thresholdCanvas(canvas, 120), thresholdCanvas(canvas, 140)];
      const rotations = [0, 90, 180, 270];
      for (const variant of variants) {
        for (const angle of rotations) {
          const targetCanvas = angle === 0 ? variant : rotateCanvas(variant, angle);
          const code = scanCanvasForQr(targetCanvas);
          if (code && code.data) {
            console.log(`  ✅ QR decode success (attempt ${attemptIndex}, rotate ${angle}°)`);
            return code.data.trim();
          }
        }
        attemptIndex += 1;
      }
    }

    return null;
  } catch (err) {
    console.log(`  ❌ QR decode error: ${err.message}`);
    return null;
  }
}

async function createOcrWorker() {
  const worker = await createWorker({ logger: () => {} });
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    tessedit_pageseg_mode: '7'
  });
  return worker;
}

function filterShortCodeCandidates(codes) {
  const blacklist = new Set(['FULL', 'NAME', 'MASK', 'MASS', 'SIZE', 'THIS', 'SHOW', 'CODE', 'DESK', 'LINE', 'ALBUM']);
  return codes.filter(code => {
    if (!/^[A-Z0-9]{4}$/.test(code)) return false;
    if (blacklist.has(code)) return false;
    if (/^[0-9]{4}$/.test(code) && code.startsWith('20')) return false;
    return true;
  });
}

async function extractShortCodesFromImage(filePath, worker) {
  try {
    const { data: { text } } = await worker.recognize(filePath);

    const normalized = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const rawMatches = Array.from(new Set((normalized.match(/\b[A-Z]{2}[0-9]{2}\b/g) || [])));
    return filterShortCodeCandidates(rawMatches);
  } catch (error) {
    console.error(`  ❌ OCR failed for ${path.basename(filePath)}:`, error.message);
    return [];
  }
}

const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';

async function runCheckin() {
  console.log(`🚀 Starting day 2 batch check-in processing...`);
  
  if (!fs.existsSync(QR_DIR)) {
    console.error(`❌ QR Directory not found: ${QR_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(QR_DIR).filter(file => {
    return file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.png');
  });

  console.log(`Found ${files.length} images to process.`);
  console.log(`Dry run mode: ${DRY_RUN ? 'ON (no updates will be written)' : 'OFF (will write updates to Firestore)'}\n`);

  const ocrWorker = await createOcrWorker();

  let successCount = 0;
  let alreadyCheckedInCount = 0;
  let failedFiles = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(QR_DIR, filename);
    const percent = ((i + 1) / files.length * 100).toFixed(1);
    
    console.log(`[${i + 1}/${files.length} - ${percent}%] Processing ${filename}...`);
    
    const qrText = await decodeQRCode(filePath);
    let student = null;
    let usedCode = null;
    let searchMethod = 'QR_CODE';

    if (qrText) {
      console.log(`  Found QR Content: "${qrText}"`);
      const uid = parseUidFromQr(qrText);
      if (uid) {
        student = await findStudentByUid(uid);
        usedCode = uid;
        if (student) {
          console.log(`  ✅ Found student by UID from QR: ${uid}`);
        } else {
          console.log(`  ⚠️  QR UID decoded but no matching user found for UID "${uid}"`);
        }
      }

      if (!student) {
        const qrCandidates = extractQrCandidates(qrText);
        if (qrCandidates.length > 0) {
          console.log(`  QR search candidates: ${qrCandidates.join(', ')}`);
          for (const candidate of qrCandidates) {
            if (candidate === uid) continue;
            const candidateStudent = await findStudent(candidate);
            if (candidateStudent) {
              student = candidateStudent;
              usedCode = candidate;
              searchMethod = 'QR_SHORT_CODE';
              console.log(`  ✅ Found student from QR candidate: ${candidate}`);
              break;
            }
          }
        }
      }

      if (!student && !uid) {
        console.log(`  ⚠️  QR decoded but no UID-like token found in "${qrText}"`);
      }
      if (!student && uid) {
        console.log(`  ⚠️  QR UID decoded but lookup failed, trying QR token candidates...`);
      }
    } else {
      console.log(`  ⚠️  QR decode failed for ${filename}`);
    }

    if (!student) {
      const ocrCodes = await extractShortCodesFromImage(filePath, ocrWorker);
      if (ocrCodes.length > 0) {
        console.log(`  OCR candidates: ${ocrCodes.join(', ')}`);
        for (const candidate of ocrCodes) {
          const candidateStudent = await findStudent(candidate);
          if (candidateStudent) {
            student = candidateStudent;
            usedCode = candidate;
            searchMethod = 'OCR_SHORT_CODE';
            console.log(`  ✅ Found student record from OCR short code: ${candidate}`);
            break;
          }
        }
      } else {
        console.log(`  ❌ No valid OCR short code found for ${filename}`);
      }
    }

    if (!student) {
      failedFiles.push(`${filename}${qrText ? ` (QR: ${qrText})` : ''}`);
      continue;
    }

    const { id: docId, data: studentData, matchedCode } = student;
    const studentName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'N/A';
    
    // Day 2 Morning check-in logic matching the web app
    if (studentData.checkin_day2_morning) {
      console.log(`  ⚠️  Already checked in: ${studentName} (${studentData.studentId || docId})`);
      alreadyCheckedInCount++;
      continue;
    }

    // Perform Day 2 Check-in
    const timestamp = getThaiISOString();
    const updatePayload = {
      checkin_day2_morning: timestamp,
      checkin_day2_morning_by: 'Admin Script CLI',
      checkin_day2_morning_by_staff_uid: 'ADMIN_SCRIPT',
      checkin_day2_morning_by_staff_pic: '',
      checkin_day2_morning_by_staff_username: 'admin_cli',
      checkin_day2_morning_operator_user: 'admin_cli',
      checkin_day2_morning_search_method: searchMethod,
      checkin_day2_morning_ip: '127.0.0.1',
      checkin_day2_morning_device_model: 'Server Node CLI',
      checkin_day2_morning_user_agent: 'Node-Canvas-jsQR',
      checkin_day2_morning_platform: 'macOS Server',
      updatedAt: timestamp
    };

    try {
      const batch = db.batch();
      const userRef = db.collection('users').doc(docId);
      batch.update(userRef, updatePayload);

      const logRef = db.collection('registration_checkin_logs').doc();
      batch.set(logRef, {
        log_id: logRef.id,
        session: 'day2_morning',
        action: 'CHECKIN_REGISTRATION_DAY2',
        timestamp,
        student_doc_id: docId,
        student_line_uid: studentData.line_uid || docId || '',
        student_id: studentData.studentId || studentData.id || '',
        student_short_code: studentData.short_code || studentData.walkin_temp_short_code || studentData.shortCode || '',
        student_group: studentData.group || studentData.assigned_group || studentData.assigned_group_name || '',
        student_name: studentName,
        department: studentData.department || '',
        search_method: searchMethod,
        staff_line_uid: 'ADMIN_SCRIPT',
        staff_username: 'admin_cli',
        staff_display_name: 'Admin Script CLI',
        staff_role: 'STAFF_SUPERVISOR',
        staff_picture_url: '',
        operator_user: 'admin_cli',
        client_ip: '127.0.0.1',
        device_model: 'Server Node CLI',
        user_agent: 'Node-Canvas-jsQR',
        platform: 'macOS Server'
      });

      if (DRY_RUN) {
        console.log(`  🧪 Dry run: would update student ${studentName} (${studentData.studentId || docId}) with search method ${searchMethod}`);
      } else {
        await batch.commit();
        console.log(`  ✅ Successfully checked in: ${studentName} (${studentData.studentId || docId})`);
      }
      successCount++;
    } catch (dbErr) {
      console.error(`  ❌ Database error for ${studentName}:`, dbErr.message);
      failedFiles.push(`${filename} (DB Error)`);
    }
  }

  await ocrWorker.terminate();

  console.log(`
==================================================
📊 BATCH DAY 2 CHECK-IN SUMMARY
==================================================
  • เช็คชื่อสำเร็จ (Success):       ${successCount}
  • เช็คชื่อไปแล้ว (Already Done): ${alreadyCheckedInCount}
  • เช็คชื่อไม่สำเร็จ (Failed):     ${failedFiles.length}
==================================================
`);

  if (failedFiles.length > 0) {
    console.log("❌ รายชื่อไฟล์ที่เช็คชื่อไม่สำเร็จ:");
    failedFiles.forEach(f => console.log(`  - ${f}`));
  }

  const reportLines = [
    `เช็คชื่อสำเร็จ: ${successCount}`,
    `เช็คชื่อไปแล้ว: ${alreadyCheckedInCount}`,
    `เช็คชื่อไม่สำเร็จ: ${failedFiles.length}`,
    '',
    'ไฟล์ที่เช็คชื่อไม่สำเร็จ:',
    ...failedFiles
  ];

  fs.writeFileSync(FAILED_FILE_PATH, reportLines.join('\n'), 'utf8');
  console.log(`Saved failed list to ${FAILED_FILE_PATH}`);
}

runCheckin().catch(err => {
  console.error("Fatal error running checkin:", err);
});
