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

    // Standard Indian vehicle registration format, e.g. TN60AK1666, TN-60-AD-9319
    const regNoPattern = /\b([A-Z]{2}\s?-?\s?\d{1,2}\s?-?\s?[A-Z]{1,3}\s?-?\s?\d{1,4})\b/;

    const extracted = {
      vehicleNumber: find([
        regNoPattern, // most reliable — matches the strict RTO format directly
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
      gvw: findNumber([
        /GVW[\s\S]{0,25}?([\d,]+\.?\d*)/i,
      ]),
      cc: findNumber([
        /(\d{2,5}(?:\.\d+)?)\s*CC\b/i,               // e.g. "1197 CC" — reliable for car docs
        /Cubic\s*Capacity[\s\S]{0,30}?([\d,]+\.?\d*)/i,
        /(?:CC|Cubic Capacity)\s*[:\-]?\s*([\d,\.]+)/i,
        // NOTE: two-wheeler policies (e.g. UIIC) often show CC as a bare number
        // in a table row with no adjacent label — cannot be reliably auto-filled.
        // Left as manual entry for those documents by design.
      ]),
      odPremium: findNumber([
        /TOTAL\s*OWN\s*DAMAGE[\s\S]{0,25}?([\d,]+\.\d{2})/i,          // SBI-style
        /Gross\s*OD\s*\(?A\)?[\s\S]{0,20}?([\d,]+\.\d{2})/i,          // UIIC-style
        /(?:OD Premium|Own Damage Premium|Total OD Premium)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      ]),
      tpPremium: findNumber([
        /TOTAL\s*TP[\s\S]{0,25}?([\d,]+\.\d{2})/i,                    // SBI-style
        /Gross\s*TP\s*\(?B\)?[\s\S]{0,20}?([\d,]+\.\d{2})/i,          // UIIC-style
        /(?:TP Premium|Third Party Premium|Total TP Premium)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      ]),
      netPremium: findNumber([
        /\bNet\s*Premium\b\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
        /\bTOTAL\s*PREMIUM\b\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,      // SBI-style, pre-GST total
        /Gross\s*OD\s*&\s*TP[\s\S]{0,30}?([\d,]+\.\d{2})/i,                  // UIIC-style, pre-GST total
        /\bPremium\s*:\s*([\d,]+\.\d{2})/i,                                  // UIIC fallback
      ]),
      grossPremium: findNumber([
        /\bFINAL\s*PREMIUM\b\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,     // SBI-style, post-GST total
        /Total\s*\(?Rounded\s*Off\)?\s*[:\-]?\s*([\d,]+\.\d{2})/i,           // UIIC-style, post-GST total
        /(?:Gross Premium|Premium Payable)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      ]),
      sourcePdf: req.file.originalname,
    };

    res.json({ extracted, rawTextPreview: text.slice(0, 500) });
  } catch (err) {
    console.error('SCAN PDF ERROR:', err);
    res.status(500).json({ message: 'Failed to scan PDF', error: err.message, stack: err.stack });
  }
};