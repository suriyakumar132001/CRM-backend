const MisPolicy = require('../models/MisPolicy');
const { PDFParse } = require('pdf-parse');

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

// ===== AI-POWERED EXTRACTION =====
async function extractWithAI(text) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('No ANTHROPIC_API_KEY configured');
  }


const prompt = `Extract the following fields from this vehicle insurance policy document text. Return ONLY a valid JSON object, no markdown formatting, no code fences, no explanation.

Fields to extract:
- vehicleNumber (string, Indian RTO format like "TN60AK1666" or "TN-60-AD-9319")
- clientName (string, the insured/policyholder's name)
- policyNumber (string)
- insuranceCompany (string, e.g. "SBI General", "United India", "ICICI Lombard")
- segment (string, e.g. "PRIVATE CAR", "TWO WHEELER", "GCV" — leave empty string if not found)
- makeModel (string, vehicle make and model, e.g. "Maruti Suzuki Swift Vxi" or "Hero Motocorp Splendor+")
- gvw (number, Gross Vehicle Weight in kg — only relevant for commercial vehicles, 0 if not applicable)
- cc (number, engine cubic capacity)
- odPremium (number, Own Damage premium amount before tax)
- tpPremium (number, Third Party premium amount before tax)
- netPremium (number, total premium before GST/tax)
- grossPremium (number, final total premium including GST/tax)

IMPORTANT for cc and gvw: These values are often found inside a "Particulars of Vehicle Insured" table row, alongside Registration No., Engine No., Chassis No., Make/Model, Year of Manufacture, Type of Body, and Seating Capacity — all crammed into one table row with column headers listed separately above (e.g. a header row saying "Cubic Capacity/KW" followed later by the vehicle's data row). In that data row, cc is typically a decimal number between 50-2500 (for two-wheelers, e.g. "97.2") or an integer 800-3500 (for cars, e.g. "1197"), usually appearing right before or after the seating capacity number and vehicle "Type of Body" description. Look carefully in any vehicle particulars table for a number in that range, even without an adjacent text label, and infer it's the CC based on typical position (after Year of Manufacture, before Seating Capacity). Only return 0 if you genuinely cannot locate any such value.

If a field cannot be found, use an empty string for text fields or 0 for number fields. Do not guess wildly, but do use reasonable inference from table structure and typical document layout as described above.

Document text:
${text.slice(0, 8000)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  const parsed = JSON.parse(cleaned);

  return {
    vehicleNumber: String(parsed.vehicleNumber || '').trim(),
    clientName: String(parsed.clientName || '').trim(),
    policyNumber: String(parsed.policyNumber || '').trim(),
    insuranceCompany: String(parsed.insuranceCompany || '').trim(),
    segment: String(parsed.segment || '').trim(),
    makeModel: String(parsed.makeModel || '').trim(),
    gvw: Number(parsed.gvw) || 0,
    cc: Number(parsed.cc) || 0,
    odPremium: Number(parsed.odPremium) || 0,
    tpPremium: Number(parsed.tpPremium) || 0,
    netPremium: Number(parsed.netPremium) || 0,
    grossPremium: Number(parsed.grossPremium) || 0,
  };
}

// ===== REGEX FALLBACK EXTRACTION (your original logic, kept as backup) =====
function extractWithRegex(text) {
  const find = (patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  };

  const findNumber = (patterns) => {
    const val = find(patterns);
    if (!val) return 0;
    const num = parseFloat(val.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const regNoPattern = /\b([A-Z]{2}\s?-?\s?\d{1,2}\s?-?\s?[A-Z]{1,3}\s?-?\s?\d{1,4})\b/;

  return {
    vehicleNumber: find([
      regNoPattern,
      /Vehicle\s*(?:Reg(?:istration)?)?\s*\bNo\b\.?\s*[:\-]?\s*([A-Z0-9\- ]{6,15})/i,
      /Registration\s*(?:No|Number)\.?\s*[:\-]?\s*([A-Z0-9\- ]{6,15})/i,
    ]),
    clientName: find([
      /(?:Insured|Client|Customer)\s*Name\s*[:\-]?\s*([A-Za-z .]{3,50})/i,
      /Name\s*of\s*(?:the\s*)?Insured\s*[:\-]?\s*([A-Za-z .]{3,50})/i,
    ]),
    policyNumber: find([
      /Policy\s*\/?\s*Certificate\s*No\.?\s*[:\-]?\s*([A-Z0-9\/]{6,30})/i,
      /Policy\s*No\.?\s*[:\-]?\s*([A-Z0-9\/]{6,30})/i,
      /Policy\s*Number\s*[:\-]?\s*([A-Z0-9\/]{6,30})/i,
    ]),
    insuranceCompany: find([
      /(United India|New India|National Insurance|Oriental Insurance|ICICI Lombard|HDFC Ergo|Bajaj Allianz|Tata AIG|Reliance General|SBI General|Cholamandalam|IFFCO Tokio|Future Generali|Liberty General|Digit Insurance)/i,
    ]),
    segment: find([
      /Segment\s*[:\-]?\s*([A-Za-z0-9 ]{3,25})/i,
      /Vehicle\s*Class\s*[:\-]?\s*([A-Za-z0-9 ]{3,25})/i,
    ]),
    makeModel: find([
      /Make\s*(?:&|and)?\s*Model\s*[:\-]?\s*([A-Za-z0-9 \/\-]{3,60})/i,
      /Make\s*[:\-]?\s*([A-Za-z0-9 \/\-]{3,60})/i,
    ]),
    gvw: findNumber([/GVW[\s\S]{0,25}?([\d,]+\.?\d*)/i]),
    cc: findNumber([
      /(\d{2,5}(?:\.\d+)?)\s*CC\b/i,
      /Cubic\s*Capacity[\s\S]{0,30}?([\d,]+\.?\d*)/i,
    ]),
    odPremium: findNumber([
      /TOTAL\s*OWN\s*DAMAGE[\s\S]{0,25}?([\d,]+\.\d{2})/i,
      /Gross\s*OD\s*\(?A\)?[\s\S]{0,20}?([\d,]+\.\d{2})/i,
      /(?:OD Premium|Own Damage Premium|Total OD Premium)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ]),
    tpPremium: findNumber([
      /TOTAL\s*TP[\s\S]{0,25}?([\d,]+\.\d{2})/i,
      /Gross\s*TP\s*\(?B\)?[\s\S]{0,20}?([\d,]+\.\d{2})/i,
      /(?:TP Premium|Third Party Premium|Total TP Premium)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ]),
    netPremium: findNumber([
      /\bNet\s*Premium\b\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      /\bTOTAL\s*PREMIUM\b\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      /Gross\s*OD\s*&\s*TP[\s\S]{0,30}?([\d,]+\.\d{2})/i,
      /\bPremium\s*:\s*([\d,]+\.\d{2})/i,
    ]),
    grossPremium: findNumber([
      /\bFINAL\s*PREMIUM\b\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      /Total\s*\(?Rounded\s*Off\)?\s*[:\-]?\s*([\d,]+\.\d{2})/i,
      /(?:Gross Premium|Premium Payable)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
    ]),
  };
}

// ===== CONTROLLERS =====

exports.getMisPolicies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user.id };

    const [policies, total] = await Promise.all([
      MisPolicy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      MisPolicy.countDocuments(filter),
    ]);

    res.json({
      data: policies,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createMisPolicy = async (req, res) => {
  try {
    const policy = await MisPolicy.create({ ...req.body, owner: req.user.id });
    res.status(201).json(policy);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Policy number already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMisPolicy = async (req, res) => {
  try {
    const policy = await MisPolicy.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteMisPolicy = async (req, res) => {
  try {
    const policy = await MisPolicy.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.scanPolicyPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF uploaded' });

    const rawText = await extractPdfText(req.file.buffer);
    const text = rawText.replace(/\r/g, '');

    let extracted;
    let method = 'ai';

    try {
      extracted = await extractWithAI(text);
    } catch (aiErr) {
      console.error('AI EXTRACTION FAILED, falling back to regex:', aiErr.message);
      extracted = extractWithRegex(text);
      method = 'regex-fallback';
    }

    extracted.sourcePdf = req.file.originalname;

    res.json({ extracted, extractionMethod: method, rawTextPreview: text.slice(0, 500) });
  } catch (err) {
    console.error('SCAN PDF ERROR:', err);
    res.status(500).json({ message: 'Failed to scan PDF', error: err.message });
  }
};