const Batch = require('../models/Batch');

exports.getBatches = async (req, res) => {
  try {
    const filter = {};
    if (req.query.standard) filter.standard = req.query.standard;
    const batches = await Batch.find(filter).sort({ standard: 1, name: 1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { name, standard } = req.body;
    const existing = await Batch.findOne({ name, standard });
    if (existing) return res.status(400).json({ message: 'Batch already exists in this standard' });
    
    const newBatch = new Batch({ name, standard });
    await newBatch.save();
    res.status(201).json(newBatch);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { name, standard } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    // Check dupe
    const existing = await Batch.findOne({ name, standard: standard || batch.standard, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: 'Batch already exists' });

    batch.name = name || batch.name;
    if (standard) batch.standard = standard;
    
    await batch.save();
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
