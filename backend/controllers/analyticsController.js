const Issue = require('../models/Issue');

// Helper: simple linear regression (x: [0..n-1], y: counts)
function linearPredict(y) {
  const n = y.length;
  if (n === 0) return 0;
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const nextX = n;
  const predicted = slope * nextX + intercept;
  return Math.max(0, Math.round(predicted));
}

exports.getDashboard = async (req, res) => {
  try {
    // Basic aggregates used by frontend
    const match = {}; // management sees all issues

    const categories = await Issue.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const pendingResolved = await Issue.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const density = await Issue.aggregate([
      { $match: match },
      { $group: { _id: { hostel: '$hostel', block: '$block' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average resolution time (hours)
    const allIssues = await Issue.find(match).select('createdAt timestamps status updatedAt').lean();
    let totalHours = 0; let resolvedCount = 0;
    allIssues.forEach(issue => {
      // Try to find a resolved timestamp
      const ts = (issue.timestamps || []).find(t => String(t.status).toLowerCase() === 'resolved');
      if (ts && issue.createdAt) {
        const hours = (new Date(ts.time) - new Date(issue.createdAt)) / (1000 * 60 * 60);
        if (!isNaN(hours) && hours >= 0) {
          totalHours += hours;
          resolvedCount += 1;
        }
      }
    });
    const avgTime = resolvedCount === 0 ? 0 : totalHours / resolvedCount;

    // Monthly estimated vendor costs (last 12 months)
    const costsAgg = await Issue.aggregate([
      { $match: { estimatedCost: { $exists: true, $ne: null } } },
      { $project: { estimatedCost: 1, createdAt: 1 } },
      { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }, totalEstimated: { $sum: '$estimatedCost' } } },
      { $sort: { '_id.month': 1 } }
    ]);

    res.json({ categories, pendingResolved, density, avgTime, monthlyEstimatedCosts: costsAgg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.predictiveAnalytics = async (req, res) => {
  try {
    // Predict next-month counts per category using simple linear regression on monthly counts
    // Get last 12 months grouped by category and month
    const agg = await Issue.aggregate([
      { $project: { category: 1, createdAt: 1 } },
      { $group: { _id: { category: '$category', month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]);

    // Build map: category -> { months: [counts in order by month] }
    const catMap = {};
    agg.forEach(row => {
      const cat = row._id.category || 'Other';
      const month = row._id.month;
      if (!catMap[cat]) catMap[cat] = { months: [], monthsMap: {} };
      catMap[cat].monthsMap[month] = row.count;
    });

    // Get sorted months (last 12 months window)
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
    }

    const predictions = [];
    Object.keys(catMap).forEach(cat => {
      const counts = months.map(m => catMap[cat].monthsMap[m] || 0);
      const predicted = linearPredict(counts);
      predictions.push({ category: cat, predictedNextMonth: predicted, history: counts });
    });

    res.json({ months, predictions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rootCauseClustering = async (req, res) => {
  try {
    // Simple clustering by combination of hostel, block, category
    const clusters = await Issue.aggregate([
      { $match: {} },
      { $group: { _id: { hostel: '$hostel', block: '$block', category: '$category' }, count: { $sum: 1 }, sampleId: { $first: '$_id' } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Map clusters to human-readable insights
    const insights = clusters.map(c => ({
      label: `${c._id.hostel || 'Unknown'} / ${c._id.block || 'Unknown'} — ${c._id.category || 'Other'}`,
      count: c.count,
      exampleIssueId: c.sampleId
    }));

    res.json({ clusters: insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Additional endpoints (vendor delays) can be added similarly

exports.vendorDelays = async (req, res) => {
  try {
    // Fetch issues with vendorType set
    const issues = await Issue.find({ vendorType: { $exists: true, $ne: null } }).select('vendorType timestamps createdAt updatedAt vendorResponses status').lean();

    const stats = { internal: { count: 0, avgResponseHours: 0, avgResolutionHours: 0 }, external: { count: 0, avgResponseHours: 0, avgResolutionHours: 0 } };
    const accum = { internal: { resp: 0, resol: 0, count: 0 }, external: { resp: 0, resol: 0, count: 0 } };

    issues.forEach(issue => {
      const type = issue.vendorType || 'internal';
      // Find Assigned timestamp
      const assignedTs = (issue.timestamps || []).find(t => String(t.status).toLowerCase() === 'assigned');
      // Find first status after assigned (response) - naive: first timestamp with time > assigned
      let responseTs = null;
      if (assignedTs) {
        const later = (issue.timestamps || []).filter(t => new Date(t.time) > new Date(assignedTs.time));
        if (later && later.length > 0) responseTs = later[0];
      }
      const resolvedTs = (issue.timestamps || []).find(t => String(t.status).toLowerCase() === 'resolved');

      if (assignedTs) {
        accum[type].count += 1;
        if (responseTs) {
          const respHours = (new Date(responseTs.time) - new Date(assignedTs.time)) / (1000 * 60 * 60);
          if (!isNaN(respHours) && respHours >= 0) accum[type].resp += respHours;
        }
        if (resolvedTs) {
          const resolHours = (new Date(resolvedTs.time) - new Date(assignedTs.time)) / (1000 * 60 * 60);
          if (!isNaN(resolHours) && resolHours >= 0) accum[type].resol += resolHours;
        }
      }
    });

    ['internal', 'external'].forEach(k => {
      const a = accum[k];
      if (a.count > 0) {
        stats[k].count = a.count;
        stats[k].avgResponseHours = a.resp / a.count;
        stats[k].avgResolutionHours = a.resol / a.count;
      }
    });

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
    // End of analytics controller

// Generate a PDF report for the management
exports.generateReport = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40 });

    // Gather metrics
    const totalComplaints = await Issue.countDocuments();
    // Avg resolution time hours
    const allIssues = await Issue.find().select('createdAt timestamps').lean();
    let totalHours = 0, resolvedCount = 0;
    allIssues.forEach(issue => {
      const ts = (issue.timestamps || []).find(t => String(t.status).toLowerCase() === 'resolved');
      if (ts && issue.createdAt) {
        const hours = (new Date(ts.time) - new Date(issue.createdAt)) / (1000 * 60 * 60);
        if (!isNaN(hours) && hours >= 0) { totalHours += hours; resolvedCount += 1; }
      }
    });
    const avgResolution = resolvedCount === 0 ? 0 : (totalHours / resolvedCount).toFixed(2);

    // Worst blocks
    const worst = await Issue.aggregate([
      { $group: { _id: { hostel: '$hostel', block: '$block' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Staff performance: using feedback to estimate
    const staffPerfAgg = await Issue.aggregate([
      { $match: { 'feedback.rating': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } }
    ]);
    const avgRating = (staffPerfAgg[0] && staffPerfAgg[0].avgRating) ? staffPerfAgg[0].avgRating.toFixed(2) : 'N/A';

    // Create PDF
    res.setHeader('Content-disposition', 'attachment; filename=hostel-monthly-report.pdf');
    res.setHeader('Content-type', 'application/pdf');
    doc.fontSize(20).text('Hostel Monthly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total complaints: ${totalComplaints}`);
    doc.text(`Average resolution time (hours): ${avgResolution}`);
    doc.text(`Staff average rating: ${avgRating}`);
    doc.moveDown();
    doc.fontSize(14).text('Worst Blocks', { underline: true });
    doc.moveDown(0.5);
    worst.forEach(w => {
      doc.fontSize(12).text(`${w._id.hostel || 'Unknown'} / ${w._id.block || 'Unknown'} — ${w.count} complaints`);
    });
    doc.end();
    doc.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Leaderboard (top contributors by points)
exports.leaderboard = async (req, res) => {
  try {
    const User = require('../models/User');
    const top = await User.find().sort({ points: -1 }).limit(10).select('email points hostel block');
    res.json({ top });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};