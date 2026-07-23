require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const leadRoutes = require('./routes/leadRoutes');
const statsRoutes = require('./routes/statsRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const policyRoutes = require('./routes/policyRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const dailyReportRoutes = require('./routes/dailyReportRoutes');
const misPolicyRoutes = require('./routes/misPolicyRoutes');
const aiRoutes = require("./routes/aiRoutes");

connectDB();

const app = express();
app.set('etag', false);
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/daily-report', dailyReportRoutes);
app.use('/api/mis-policies', misPolicyRoutes);
app.use("/api/ai", aiRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));