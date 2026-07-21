const ExcelJS = require('exceljs');
const Contact = require('../models/Contact');
const Lead = require('../models/Lead');
const Policy = require('../models/Policy');
const Payout = require('../models/Payout');

// ===== CONTACTS =====

exports.exportContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ owner: req.user.id }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contacts');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Job Title', key: 'jobTitle', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    sheet.getRow(1).font = { bold: true };

    contacts.forEach((c) => {
      sheet.addRow({
        name: c.name, email: c.email, phone: c.phone, company: c.company,
        jobTitle: c.jobTitle, status: c.status, notes: c.notes,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.importContacts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const contactsToInsert = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const [, name, email, phone, company, jobTitle, status, notes] = row.values;
      if (!name) return;

      contactsToInsert.push({
        owner: req.user.id,
        name, email: email || '', phone: phone || '', company: company || '',
        jobTitle: jobTitle || '', status: status || 'active', notes: notes || '',
      });
    });

    if (contactsToInsert.length === 0) {
      return res.status(400).json({ message: 'No valid rows found in file' });
    }

    const inserted = await Contact.insertMany(contactsToInsert);
    res.status(201).json({ message: `${inserted.length} contacts imported`, contacts: inserted });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===== LEADS =====

exports.exportLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ owner: req.user.id }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leads');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Value (₹)', key: 'value', width: 15 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    sheet.getRow(1).font = { bold: true };

    leads.forEach((l) => {
      sheet.addRow({
        name: l.name, email: l.email, phone: l.phone, company: l.company,
        source: l.source, status: l.status, value: l.value, notes: l.notes,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===== POLICIES =====

exports.exportPolicies = async (req, res) => {
  try {
    const policies = await Policy.find({ owner: req.user.id }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Policies');

    sheet.columns = [
      { header: 'Parent ID', key: 'parentId', width: 16 },
      { header: 'Category', key: 'category', width: 12 },
      { header: 'Proposal Number', key: 'proposalNumber', width: 26 },
      { header: 'Source', key: 'sourceOfPurchase', width: 10 },
      { header: 'Order ID', key: 'orderId', width: 26 },
      { header: 'Gateway Txn ID', key: 'gatewayTransactionId', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 22 },
      { header: 'Mobile', key: 'mobileNumber', width: 14 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Policy Number', key: 'policyNumber', width: 26 },
      { header: 'Previous Policy No.', key: 'previousPolicyNumber', width: 22 },
      { header: 'Policy Main ID', key: 'policyMainId', width: 20 },
      { header: 'Product', key: 'product', width: 16 },
      { header: 'Policy Type', key: 'policyType', width: 12 },
      { header: 'Txn Amount', key: 'txnAmount', width: 12 },
      { header: 'Txn Date', key: 'dateOfTxn', width: 14 },
      { header: 'Payment Gateway', key: 'paymentGateway', width: 16 },
      { header: 'Payment Status', key: 'paymentStatus', width: 14 },
      { header: 'Settlement Date', key: 'paymentSettlementDate', width: 14 },
      { header: 'Settlement Status', key: 'paymentSettlementStatus', width: 14 },
      { header: 'Error Description', key: 'errorDescription', width: 24 },
      { header: 'Office Code', key: 'officeCode', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    sheet.getRow(1).font = { bold: true };

    policies.forEach((p) => {
      sheet.addRow({
        parentId: p.parentId, category: p.category, proposalNumber: p.proposalNumber,
        sourceOfPurchase: p.sourceOfPurchase, orderId: p.orderId, gatewayTransactionId: p.gatewayTransactionId,
        customerName: p.customerName, mobileNumber: p.mobileNumber, email: p.email,
        policyNumber: p.policyNumber, previousPolicyNumber: p.previousPolicyNumber, policyMainId: p.policyMainId,
        product: p.product, policyType: p.policyType, txnAmount: p.txnAmount,
        dateOfTxn: p.dateOfTxn ? p.dateOfTxn.toISOString().slice(0, 10) : '',
        paymentGateway: p.paymentGateway, paymentStatus: p.paymentStatus,
        paymentSettlementDate: p.paymentSettlementDate ? p.paymentSettlementDate.toISOString().slice(0, 10) : '',
        paymentSettlementStatus: p.paymentSettlementStatus, errorDescription: p.errorDescription,
        officeCode: p.officeCode, notes: p.notes,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=policies.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const POLICY_HEADER_MAP = {
  parentid: 'parentId', transactiondatederived: 'transactionDate', transactiondate: 'transactionDate',
  createddttm: null, createdby: 'createdBy', category: 'category', proposalnumber: 'proposalNumber',
  sourceofpurchase: 'sourceOfPurchase', source: 'sourceOfPurchase', orderid: 'orderId',
  gatewaytransactionid: 'gatewayTransactionId', paymentstatus: 'paymentStatus', errordescription: 'errorDescription',
  firstname: 'customerName', customername: 'customerName', name: 'customerName',
  txnamount: 'txnAmount', amount: 'txnAmount', dateoftxn: 'dateOfTxn', txndate: 'dateOfTxn',
  paymentsettlementdate: 'paymentSettlementDate', settlementdate: 'paymentSettlementDate',
  paymentsettlementstatus: 'paymentSettlementStatus', settlementstatus: 'paymentSettlementStatus',
  policynumber: 'policyNumber', product: 'product', finalstatus: 'finalStatus',
  previouspolicynumber: 'previousPolicyNumber', mobilenumber: 'mobileNumber', mobile: 'mobileNumber',
  phone: 'mobileNumber', email: 'email', policytype: 'policyType', textsearchablepolicy: null,
  paymentgateway: 'paymentGateway', policymainid: 'policyMainId', officecode: 'officeCode', notes: 'notes',
  policyenddate: 'policyEndDate', expirydate: 'policyEndDate', enddate: 'policyEndDate',
  validtill: 'policyEndDate', validupto: 'policyEndDate',
};

const normalizeHeader = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const DATE_FIELDS = ['dateOfTxn', 'transactionDate', 'paymentSettlementDate', 'policyEndDate'];

exports.importPolicies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.worksheets[0];

    const headerRow = sheet.getRow(1).values;
    const colMap = {};

    headerRow.forEach((header, idx) => {
      if (!header) return;
      const field = POLICY_HEADER_MAP[normalizeHeader(header)];
      if (field) colMap[idx] = field;
    });

    const unmatchedHeaders = headerRow
      .map((h, idx) => (h && !colMap[idx] ? String(h) : null))
      .filter(Boolean);

    console.log('Column Map:', colMap);
    console.log('Unmatched headers:', unmatchedHeaders);

    if (Object.keys(colMap).length === 0) {
      return res.status(400).json({
        message: 'Could not recognize any columns in this file.',
        unmatchedHeaders,
      });
    }

    const toInsert = [];
    const errors = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const record = { owner: req.user.id };
      let hasAnyValue = false;

      row.values.forEach((cellValue, idx) => {
        const field = colMap[idx];
        if (!field) return;
        if (cellValue === null || cellValue === undefined || cellValue === '') return;

        hasAnyValue = true;

        if (DATE_FIELDS.includes(field)) {
          const d = new Date(cellValue);
          if (!isNaN(d.getTime())) record[field] = d;
        } else if (field === 'txnAmount') {
          const n = Number(cellValue);
          record[field] = isNaN(n) ? 0 : n;
        } else {
          record[field] = String(cellValue).trim();
        }
      });

      // Skip completely blank rows only
      if (!hasAnyValue) return;

      const notes = [];

      if (!record.customerName) {
        record.customerName = 'Unknown Customer';
        notes.push('customerName missing');
      }

      if (!record.policyNumber) {
        record.policyNumber = `AUTO-${Date.now()}-${rowNumber}`;
        notes.push('policyNumber auto-generated');
      }

      if (record.txnAmount === undefined || Number.isNaN(record.txnAmount)) {
        record.txnAmount = 0;
        notes.push('txnAmount missing, set to 0');
      }

      if (!record.policyEndDate) {
        const base = record.dateOfTxn || new Date();
        const fallbackEnd = new Date(base);
        fallbackEnd.setFullYear(fallbackEnd.getFullYear() + 1);
        record.policyEndDate = fallbackEnd;
        notes.push('policyEndDate auto-calculated (+1 year from txn date)');
      }

      record.category = record.category || 'VEHICLE';
      record.product = record.product || 'TWO_WHEELER';
      record.policyType = record.policyType || 'FRESH';
      record.paymentStatus = record.paymentStatus || 'SUCCESS';
      record.paymentSettlementStatus = record.paymentSettlementStatus || 'PENDING';

      if (notes.length) {
        errors.push(`Row ${rowNumber}: ${notes.join(', ')}`);
      }

      toInsert.push(record);
    });

    if (toInsert.length === 0) {
      return res.status(400).json({
        message: 'No valid rows found',
        errors,
        unmatchedHeaders,
      });
    }

    let insertedCount = 0;
    let insertErrors = [];
    try {
      const inserted = await Policy.insertMany(toInsert, { ordered: false });
      insertedCount = inserted.length;
    } catch (bulkErr) {
      // insertMany with ordered:false still throws, but partial successes are in bulkErr.insertedDocs
      insertedCount = bulkErr.insertedDocs ? bulkErr.insertedDocs.length : 0;
      if (bulkErr.writeErrors) {
        insertErrors = bulkErr.writeErrors.map(
          (e) => `Row failed: ${e.err?.errmsg || e.errmsg || 'duplicate or validation error'}`
        );
      }
    }

    return res.status(201).json({
      message: `${insertedCount} of ${toInsert.length} policies imported successfully`,
      inserted: insertedCount,
      skipped: toInsert.length - insertedCount,
      errors: [...errors, ...insertErrors],
      unmatchedHeaders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message,
    });
  }
};
// ===== PAYOUTS =====

exports.exportPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ owner: req.user.id }).populate('policy', 'policyNumber').sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payouts');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Customer', key: 'customerName', width: 22 },
      { header: 'Amount (₹)', key: 'amount', width: 14 },
      { header: 'Description', key: 'description', width: 30 },
    ];
    sheet.getRow(1).font = { bold: true };

    payouts.forEach((p) => {
      sheet.addRow({
        date: p.date ? p.date.toISOString().slice(0, 10) : '',
        type: p.type, customerName: p.customerName, amount: p.amount, description: p.description,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payouts.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.importPayouts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const toInsert = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const [, date, type, customerName, amount, description] = row.values;
      if (!type || !amount) return;

      toInsert.push({
        owner: req.user.id,
        date: date ? new Date(date) : new Date(),
        type, customerName: customerName || '', amount: Number(amount), description: description || '',
      });
    });

    if (toInsert.length === 0) {
      return res.status(400).json({ message: 'No valid rows found' });
    }

    const inserted = await Payout.insertMany(toInsert);
    res.status(201).json({ message: `${inserted.length} payouts imported` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===== DAILY REPORT EXPORT =====

exports.exportDailyReport = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const ownerId = new mongoose.Types.ObjectId(req.user.id);
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(new Date(dateParam).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(dateParam).setHours(23, 59, 59, 999));

    const policies = await Policy.find({ owner: ownerId, createdAt: { $gte: startOfDay, $lte: endOfDay } });
    const payouts = await Payout.find({ owner: ownerId, date: { $gte: startOfDay, $lte: endOfDay } });

    const workbook = new ExcelJS.Workbook();

    const policySheet = workbook.addWorksheet('Policies Sold');
    policySheet.columns = [
      { header: 'Customer', key: 'customerName', width: 22 },
      { header: 'Policy No.', key: 'policyNumber', width: 20 },
      { header: 'Amount (₹)', key: 'txnAmount', width: 14 },
    ];
    policySheet.getRow(1).font = { bold: true };
    policies.forEach((p) => policySheet.addRow({
      customerName: p.customerName, policyNumber: p.policyNumber, txnAmount: p.txnAmount,
    }));

    const payoutSheet = workbook.addWorksheet('Payouts');
    payoutSheet.columns = [
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Customer', key: 'customerName', width: 22 },
      { header: 'Amount (₹)', key: 'amount', width: 14 },
      { header: 'Description', key: 'description', width: 30 },
    ];
    payoutSheet.getRow(1).font = { bold: true };
    payouts.forEach((p) => payoutSheet.addRow({
      type: p.type, customerName: p.customerName, amount: p.amount, description: p.description,
    }));

    const fileDate = startOfDay.toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=daily-report-${fileDate}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const MisPolicy = require('../models/MisPolicy');

exports.exportMisPolicies = async (req, res) => {
  try {
    const policies = await MisPolicy.find({ owner: req.user.id }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('MIS Policies');

    sheet.columns = [
      { header: 'VehicleNumber', key: 'vehicleNumber', width: 18 },
      { header: 'CLIENT NAME', key: 'clientName', width: 26 },
      { header: 'Policy Number', key: 'policyNumber', width: 24 },
      { header: 'Insurance Company', key: 'insuranceCompany', width: 18 },
      { header: 'Segment', key: 'segment', width: 16 },
      { header: 'Make & Model', key: 'makeModel', width: 35 },
      { header: 'GVW', key: 'gvw', width: 10 },
      { header: 'CC', key: 'cc', width: 10 },
      { header: 'OD', key: 'odPremium', width: 12 },
      { header: 'TP', key: 'tpPremium', width: 12 },
      { header: 'NET', key: 'netPremium', width: 12 },
      { header: 'Gross', key: 'grossPremium', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    policies.forEach((p) => {
      sheet.addRow({
        vehicleNumber: p.vehicleNumber, clientName: p.clientName, policyNumber: p.policyNumber,
        insuranceCompany: p.insuranceCompany, segment: p.segment, makeModel: p.makeModel,
        gvw: p.gvw, cc: p.cc, odPremium: p.odPremium, tpPremium: p.tpPremium,
        netPremium: p.netPremium, grossPremium: p.grossPremium,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=mis-policies.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const MIS_HEADER_MAP = {
  vehiclenumber: 'vehicleNumber', clientname: 'clientName', policynumber: 'policyNumber',
  insurancecompany: 'insuranceCompany', segment: 'segment', makemodel: 'makeModel',
  gvw: 'gvw', cc: 'cc', od: 'odPremium', tp: 'tpPremium', net: 'netPremium', gross: 'grossPremium',
};

exports.importMisPolicies = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const headerRow = sheet.getRow(1).values;
    const colMap = {};
    headerRow.forEach((header, idx) => {
      if (!header) return;
      const norm = String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
      const field = MIS_HEADER_MAP[norm];
      if (field) colMap[idx] = field;
    });

    const toInsert = [];
    const errors = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record = { owner: req.user.id };

      row.values.forEach((cellValue, idx) => {
        const field = colMap[idx];
        if (!field || cellValue === null || cellValue === undefined || cellValue === '') return;

        if (['gvw', 'cc', 'odPremium', 'tpPremium', 'netPremium', 'grossPremium'].includes(field)) {
          record[field] = Number(cellValue) || 0;
        } else {
          record[field] = String(cellValue).trim();
        }
      });

      if (!record.vehicleNumber || !record.clientName || !record.policyNumber) {
        errors.push(`Row ${rowNumber}: missing required field(s)`);
        return;
      }
      toInsert.push(record);
    });

    if (toInsert.length === 0) {
      return res.status(400).json({ message: 'No valid rows found', errors });
    }

    let insertedCount = 0;
    try {
      const inserted = await MisPolicy.insertMany(toInsert, { ordered: false });
      insertedCount = inserted.length;
    } catch (bulkErr) {
      insertedCount = bulkErr.insertedDocs ? bulkErr.insertedDocs.length : 0;
    }

    res.status(201).json({
      message: `${insertedCount} of ${toInsert.length} MIS policies imported`,
      skipped: toInsert.length - insertedCount,
      errors,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};