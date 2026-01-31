const Interaction = require('../models/Interaction');

exports.createInteraction = async (req, res) => {
  try {
    const { type, content, parentId, parentType } = req.body;

    const interaction = new Interaction({
      type,
      content,
      author: req.user._id,
      parentId,
      parentType: parentType || 'Issue'
    });

    await interaction.save();
    await interaction.populate('author', 'email hostel block room');
    
    res.status(201).json(interaction);
  } catch (err) {
    res.status(400).json({ msg: 'Error creating interaction', error: err.message });
  }
};

exports.getInteractions = async (req, res) => {
  try {
    const { parentId } = req.query;

    if (!parentId) {
      return res.status(400).json({ msg: 'Parent ID required' });
    }

    const interactions = await Interaction.find({ parentId })
      .populate('author', 'email hostel block room')
      .sort({ createdAt: -1 });

    res.json(interactions);
  } catch (err) {
    res.status(400).json({ msg: 'Error fetching interactions', error: err.message });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { reaction } = req.body;
    const interaction = await Interaction.findById(req.params.id);

    if (!interaction) {
      return res.status(404).json({ msg: 'Interaction not found' });
    }

    if (!interaction.reactions) {
      interaction.reactions = {};
    }

    if (!interaction.reactions[reaction]) {
      interaction.reactions[reaction] = [];
    }

    if (!interaction.reactions[reaction].includes(req.user._id)) {
      interaction.reactions[reaction].push(req.user._id);
    }

    await interaction.save();
    res.json(interaction);
  } catch (err) {
    res.status(400).json({ msg: 'Error adding reaction', error: err.message });
  }
};

exports.deleteInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);

    if (!interaction) {
      return res.status(404).json({ msg: 'Interaction not found' });
    }

    if (interaction.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this' });
    }

    await Interaction.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Interaction deleted' });
  } catch (err) {
    res.status(400).json({ msg: 'Error deleting interaction', error: err.message });
  }
};
