const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Policy = require('../models/Policy');

exports.generateFollowUp = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ message: 'AI follow-up not configured — missing ANTHROPIC_API_KEY' });
    }

    const { entityType, entityId, channel, tone } = req.body;
    // entityType: 'lead' | 'contact'
    // channel: 'email' | 'sms' | 'whatsapp'
    // tone: 'friendly' | 'formal' | 'urgent'  (optional, defaults to friendly)

    if (!entityType || !entityId) {
      return res.status(400).json({ message: 'entityType and entityId are required' });
    }

    let record;
    let context = {};

    if (entityType === 'lead') {
      record = await Lead.findOne({ _id: entityId, owner: req.user.id });
      if (!record) return res.status(404).json({ message: 'Lead not found' });
      context = {
        name: record.name,
        company: record.company || '',
        source: record.source || '',
        status: record.status,
        value: record.value || 0,
        notes: record.notes || '',
        createdDaysAgo: Math.floor((Date.now() - new Date(record.createdAt)) / (1000 * 60 * 60 * 24)),
      };
    } else if (entityType === 'contact') {
      record = await Contact.findOne({ _id: entityId, owner: req.user.id });
      if (!record) return res.status(404).json({ message: 'Contact not found' });

      const policies = await Policy.find({ owner: req.user.id, mobileNumber: record.phone }).sort({ createdAt: -1 }).limit(3);

      context = {
        name: record.name,
        company: record.company || '',
        jobTitle: record.jobTitle || '',
        notes: record.notes || '',
        existingPolicies: policies.map((p) => ({
          product: p.product,
          policyNumber: p.policyNumber,
          expiryDate: p.policyEndDate,
        })),
      };
    } else {
      return res.status(400).json({ message: 'entityType must be "lead" or "contact"' });
    }

    const channelInstructions = {
      email: 'Write a professional email. Include a short subject line (prefixed "Subject:") followed by the email body. Keep the body under 120 words.',
      sms: 'Write a short SMS message, under 300 characters, no subject line, direct and clear.',
      whatsapp: 'Write a friendly WhatsApp message, under 400 characters, can use light informal tone, no subject line.',
    };

    const toneMap = {
      friendly: 'warm and personable',
      formal: 'professional and formal',
      urgent: 'polite but conveying time-sensitivity (e.g. renewal deadline approaching)',
    };

    const prompt = `You are a helpful assistant for an insurance sales agent, drafting a follow-up message to a ${entityType}.

${channelInstructions[channel] || channelInstructions.email}
Tone: ${toneMap[tone] || toneMap.friendly}.

Context about this person:
${JSON.stringify(context, null, 2)}

Instructions:
- Personalize using their name and relevant details (e.g. mention their existing policy/product if present, or their interest source if a lead)
- Do not invent facts not present in the context above
- Do not include placeholder brackets like [Agent Name] — instead write it generically as "our team" or omit signing off with a name
- Return ONLY the message text (and subject line if email), no explanation, no markdown formatting`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errText}`);
    }

    const aiData = await response.json();
    const draft = aiData.content?.[0]?.text?.trim() || '';

    res.json({ draft, channel, entityType });
  } catch (err) {
    console.error('AI FOLLOW-UP ERROR:', err);
    res.status(500).json({ message: 'Failed to generate follow-up', error: err.message });
  }
};