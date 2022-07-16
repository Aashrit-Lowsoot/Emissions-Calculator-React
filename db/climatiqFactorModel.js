const mongoose = require("mongoose");

const ClimatiqFactorSchema = new mongoose.Schema({
    type: String,
    factors: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model.ClimatiqFactor || mongoose.model("ClimatiqFactor", ClimatiqFactorSchema);