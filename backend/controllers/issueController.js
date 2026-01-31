const Issue = require('../models/Issue');
const Interaction = require('../models/Interaction');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const cloudinary = require('cloudinary').v2;
// Configure cloudinary with .env

exports.reportIssue = async (req, res) => {
  try {
    const { category, priority, description, visibility } = req.body;
    const media = []; // Upload to Cloudinary using multer in routes
    
    // Add initial timestamp
    const timestamps = [{ status: 'Reported', time: new Date() }];
    
    const issue = new Issue({
      reporter: req.user._id,
      category, priority, description, visibility, media, timestamps,
      hostel: req.user.hostel, block: req.user.block, room: req.user.room,
      status: 'Reported',
      meTooCount: 1 // Reporter is counted as "me too"
    });
    await issue.save();
    // Award points for reporting a genuine issue
    try {
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });
    } catch (e) {
      console.warn('Failed to award points for reporting:', e.message);
    }
    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ msg: 'Error reporting issue', error: err.message });
  }
};

// Get all public issues or all issues for management
exports.getIssues = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      // Students see only public issues or their own issues
      query = { 
        $or: [
          { visibility: 'public' },
          { reporter: req.user._id }
        ]
      };
    }
    // Management sees all issues
    
    console.log('getIssues called by user:', req.user?._id, 'role:', req.user?.role, 'using query:', JSON.stringify(query));
    const issues = await Issue.find(query)
      .populate('reporter', 'email hostel block room')
      .sort({ createdAt: -1 });
    
    res.json(issues);
  } catch (err) {
    res.status(400).json({ msg: 'Error fetching issues', error: err.message });
  }
};

// Get only user's own issues
exports.getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ reporter: req.user._id })
      .populate('reporter', 'email hostel block room')
      .sort({ createdAt: -1 });
    
    res.json(issues);
  } catch (err) {
    res.status(400).json({ msg: 'Error fetching your issues', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    
    issue.status = status;
    issue.timestamps.push({ status: status, time: new Date() });
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(400).json({ msg: 'Error updating status', error: err.message });
  }
};

exports.assignIssue = async (req, res) => {
  try {
    const { assignedTo, vendorId, vendorType, estimatedCost, slaDeadline } = req.body;
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    
    issue.assignedTo = assignedTo;
    // Handle vendor assignment details
    if (vendorType) {
      issue.vendorType = vendorType;
    }
    if (vendorId) {
      issue.vendor = vendorId;
    }
    if (estimatedCost) {
      issue.estimatedCost = estimatedCost;
    }
    if (slaDeadline) {
      issue.slaDeadline = new Date(slaDeadline);
    }

    issue.status = 'Assigned';
    issue.timestamps.push({ status: 'Assigned', time: new Date() });
    const saved = await issue.save();

    // Notify reporters via email about assignment
    try {
      const reporters = Array.from(new Set([...(saved.reporters || []).map(r => String(r)), String(saved.reporter || '')].filter(Boolean)));
      if (reporters.length > 0) {
        const users = await User.find({ _id: { $in: reporters } }).select('email');
        users.forEach(u => {
          if (u && u.email) {
            sendEmail(u.email, 'Issue Assigned', `Your reported issue (${saved._id}) has been assigned. Status: Assigned.`);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to notify reporters after assign:', e.message);
    }

    res.json(saved);
  } catch (err) {
    res.status(400).json({ msg: 'Error assigning issue', error: err.message });
  }
};

// exports.mergeDuplicates = async (req, res) => {
//   try {
//     const { mainId, dupIds } = req.body;
//     const main = await Issue.findById(mainId);
    
//     if (!main) {
//       return res.status(404).json({ msg: 'Main issue not found' });
//     }
    
//     main.duplicates.push(...dupIds);
//     await main.save();
    
//     // Update duplicate issues to reference the main issue
//     await Issue.updateMany({ _id: { $in: dupIds } }, { $set: { status: 'Merged' } });
    
//     res.json({ msg: 'Issues merged successfully', mainId });
//   } catch (err) {
//     res.status(400).json({ msg: 'Error merging issues', error: err.message });
//   }
// };

exports.mergeIssues = async (req, res) => {
  try {
    const { mainId, dupIds } = req.body; // mainId: primary issue ID, dupIds: array of duplicate IDs
    if (!mainId || !dupIds || !Array.isArray(dupIds) || dupIds.length === 0) {
      return res.status(400).json({ error: 'Invalid merge parameters' });
    }

    // Fetch main issue
    const mainIssue = await Issue.findById(mainId);
    if (!mainIssue) {
      return res.status(404).json({ error: 'Main issue not found' });
    }

    // Fetch duplicates and merge data
    const duplicates = await Issue.find({ _id: { $in: dupIds } });
    if (duplicates.length !== dupIds.length) {
      return res.status(404).json({ error: 'Some duplicate issues not found' });
    }

    // Preserve reporters: Add unique reporters from duplicates to main
    const existing = (mainIssue.reporters && mainIssue.reporters.length) ? mainIssue.reporters.map(r => r.toString()) : [(mainIssue.reporter || '').toString()];
    const dupReporters = duplicates.map(d => (d.reporter || '').toString()).filter(Boolean);
    const all = Array.from(new Set([...existing, ...dupReporters]));
    mainIssue.reporters = all;

    // Merge comments (reparent interactions to main issue)
    await Interaction.updateMany({ parentId: { $in: dupIds } }, { $set: { parentId: mainId } });

    // Merge meToo counts
    const totalMeToo = duplicates.reduce((sum, d) => sum + (d.meTooCount || 0), mainIssue.meTooCount || 0);
    mainIssue.meTooCount = totalMeToo;

    // Append duplicate ids to duplicates array and mark merged
    mainIssue.duplicates = Array.from(new Set([...(mainIssue.duplicates || []).map(id => id.toString()), ...dupIds.map(id => id.toString())]));

    // Mark duplicates as merged (add status 'merged' and reference main)
    await Issue.updateMany({ _id: { $in: dupIds } }, { $set: { status: 'Merged', merged: true, mergedInto: mainId } });

    // Save main issue
    await mainIssue.save();

    res.status(200).json({ message: 'Issues merged successfully', mergedIssue: mainIssue });
  } catch (error) {
    res.status(500).json({ error: 'Merge failed: ' + error.message });
  }
};

exports.meToo = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    
    issue.meTooCount += 1;
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(400).json({ msg: 'Error updating Me Too count', error: err.message });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    
    issue.feedback = { rating, comment };
    await issue.save();
    // Award points for feedback participation
    try {
      if (req.user && req.user._id) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: 2 } });
      }
    } catch (e) {
      console.warn('Failed to award points for feedback:', e.message);
    }
    res.json(issue);
  } catch (err) {
    res.status(400).json({ msg: 'Error adding feedback', error: err.message });
  }
};

exports.setRootCause = async (req, res) => {
  try {
    const { rootCause, vendorType } = req.body;
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    
    issue.rootCause = rootCause;
    issue.vendorType = vendorType;
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(400).json({ msg: 'Error setting root cause', error: err.message });
  }
};

exports.resolveIssue = async (req, res) => {
  try {
    const { rootCause, vendorType } = req.body;
    console.log('resolveIssue called for issueId:', req.params.id, 'by user:', req.user?._id, 'payload:', { rootCause, vendorType });
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      console.warn('resolveIssue: Issue not found for id:', req.params.id);
      return res.status(404).json({ msg: 'Issue not found' });
    }
    
    issue.status = 'Resolved';
    if (rootCause) issue.rootCause = rootCause;
    if (vendorType) issue.vendorType = vendorType;
    issue.timestamps.push({ status: 'Resolved', time: new Date() });
    const saved = await issue.save();

    // Award points to reporters and email them
    try {
      const reporters = Array.from(new Set([...(saved.reporters || []).map(r => String(r)), String(saved.reporter || '')].filter(Boolean)));
      if (reporters.length > 0) {
        const users = await User.find({ _id: { $in: reporters } });
        for (const u of users) {
          if (!u) continue;
          const updated = await User.findByIdAndUpdate(u._id, { $inc: { points: 10 } }, { new: true });
          if (updated.points >= 50) {
            await User.findByIdAndUpdate(u._id, { $addToSet: { badges: 'Top Reporter' } });
          }
          if (u.email) {
            sendEmail(u.email, 'Issue Resolved', `Your reported issue (${saved._id}) has been marked Resolved. Thank you!`);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to award points or notify reporters on resolve:', e.message);
    }

    console.log('resolveIssue: Issue saved successfully, new status:', saved.status);
    res.json(saved);
  } catch (err) {
    console.error('resolveIssue error:', err.message);
    res.status(400).json({ msg: 'Error resolving issue', error: err.message });
  }
};

exports.uploadFinalBill = async (req, res) => {
  try {
    const { finalBillUrl, paymentStatus } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ msg: 'Issue not found' });

    // If a file was uploaded via multer, upload to Cloudinary
    if (req.file) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        const uploadRes = await cloudinary.uploader.upload(req.file.path, { folder: 'final_bills' });
        if (uploadRes && uploadRes.secure_url) {
          issue.finalBillUrl = uploadRes.secure_url;
        }
      } catch (e) {
        console.warn('Cloudinary upload failed:', e.message);
      }
    }

    if (finalBillUrl) issue.finalBillUrl = finalBillUrl;
    if (paymentStatus) issue.paymentStatus = paymentStatus;
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(400).json({ msg: 'Error uploading final bill', error: err.message });
  }
};

