const mongoose = require("mongoose");

const ElectricityEmissionModel = new mongoose.Schema({
    energy: {
        type: Number,
        default: 1
    },

    factorType: {
        type: Number,
        required: [true, "Please provide the factor type!"],
    },

    date: {
        type: Date,
        default: Date.now,
    },

    calculation: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, "Please provide the calculation!"],
    },
});

module.exports = mongoose.model.ElectricityEmission || mongoose.model("ElectricityEmission", ElectricityEmissionModel);