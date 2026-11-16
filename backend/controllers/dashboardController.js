const Application = require('../models/Application');
const Interview = require('../models/Interview');

// GET /api/dashboard  -> summary numbers for the logged-in user
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Count the user's applications per status.
    // $match keeps only this user's applications, $group counts them by status.
    const grouped = await Application.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Start every status at 0 so the frontend always receives all five,
    // then fill in the real counts.
    const statusCounts = {};
    Application.schema.path('status').enumValues.forEach((status) => {
      statusCounts[status] = 0;
    });

    let totalApplications = 0;
    grouped.forEach((item) => {
      statusCounts[item._id] = item.count;
      totalApplications += item.count;
    });

    // Phase 2: success rates as whole percentages, based on each application's CURRENT status.
    // With no applications every rate is 0 (this also avoids dividing by zero).
    const toPercent = (part) =>
      totalApplications === 0 ? 0 : Math.round((part / totalApplications) * 100);

    const responded = totalApplications - statusCounts['Applied'];
    const interviewed =
      statusCounts['Interview Scheduled'] + statusCounts['Interviewed'] + statusCounts['Offer'];

    const responseRate = toPercent(responded);
    const interviewRate = toPercent(interviewed);
    const offerRate = toPercent(statusCounts['Offer']);

    // 2. Count interviews that are still in the future.
    // Interviews link to applications, so first get this user's application ids.
    const applicationIds = await Application.distinct('_id', { user: userId });
    const upcomingInterviews = await Interview.countDocuments({
      application: { $in: applicationIds },
      date: { $gte: now }
    });

    // 3. The next 5 application deadlines, soonest first.
    const upcomingDeadlines = await Application.find({
      user: userId,
      deadline: { $gte: now }
    })
      .sort({ deadline: 1 })
      .limit(5)
      .select('company role status deadline');

    res.json({
      totalApplications,
      statusCounts,
      responseRate,
      interviewRate,
      offerRate,
      upcomingInterviews,
      upcomingDeadlines
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};