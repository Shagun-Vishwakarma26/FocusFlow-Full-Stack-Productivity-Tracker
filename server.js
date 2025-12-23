const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express(); // Move this HERE (above the app.use lines)

app.use(cors()); 
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/productivityDB');

const ActivitySchema = new mongoose.Schema({
    domain: String,
    duration: Number, 
    category: String,
    timestamp: { type: Date, default: Date.now }
});
const Activity = mongoose.model('Activity', ActivitySchema);

const getCategory = (url) => {
    const productive = /github|stackoverflow|linkedin|docs|coursera|trello/;
    const unproductive = /youtube|facebook|instagram|netflix|twitter|reddit/;
    if (productive.test(url)) return 'Productive';
    if (unproductive.test(url)) return 'Unproductive';
    return 'Neutral';
};

app.post('/api/track', async (req, res) => {
    const { domain, duration } = req.body;
    const activity = new Activity({ 
        domain, 
        duration, 
        category: getCategory(domain) 
    });
    await activity.save();
    res.sendStatus(200);
});

app.get('/api/weekly', async (req, res) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const data = await Activity.aggregate([
        { $match: { timestamp: { $gte: weekAgo } } },
        { $group: {
            _id: { 
                day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                cat: "$category"
            },
            total: { $sum: "$duration" }
        }},
        { $sort: { "_id.day": 1 } }
    ]);
    res.json(data);
});

app.listen(5000, () => console.log("Server running on Port 5000"));