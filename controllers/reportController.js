const { default: mongoose } = require("mongoose");
const Report = require("../models/reportModel");
const User = require("../models/userModel");

 

// Create a new report
const createReport = async (req, res) => {
  try {
    const { reporter, reportedUser } = req.body;

    // Check if both users exist

    if(!reporter || !reportedUser){
        return res.status(400).json({
            message:'reporter and reportedUser are required',
            success:false,
        })
    }

      if (!mongoose.Types.ObjectId.isValid(reporter)) {
          return res.status(400).json({ message: "Invalid reporter", success: false });
        }
        if (!mongoose.Types.ObjectId.isValid(reportedUser)) {
          return res.status(400).json({ message: "Invalid reportedUser", success: false });
        }
    
    const reportedExists = await User.findById(reportedUser);
    if (!reportedExists) {
      return res.status(404).json({ message: 'Reported user not found', success:false });
    }

    const reporterExists = await User.findById(reporter);

    if (!reporterExists) {
        return res.status(404).json({ message: 'reporter user not found', success:false });
      }
  
   const isHasReport = await Report.findOne({reporter,reportedUser})

   if(isHasReport){
    return res.status(400).json({
        message:'you already reported this user',
        success:false,
    })
   }
    const report = new Report({ reporter, reportedUser });
    await report.save();

    res.status(201).json({ message: 'Report submitted successfully', data:report,success:true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message,success:false });
  }
};

// Get all reports
const  getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('reporter reportedUser', 'name email');
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getReportById = async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId).populate('reporter reportedUser', 'name email');
  
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
  
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
// Update report status
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Reviewed', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.status(200).json({ message: 'Report status updated', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {createReport,getAllReports,deleteReport,updateReportStatus,getReportById}