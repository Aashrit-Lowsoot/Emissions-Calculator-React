const mongoose = require("mongoose");

const GSElectricityEmissionModel = new mongoose.Schema({
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

    fromSheets: {
        type: Boolean,
        default: true,
    },
});

module.exports = mongoose.model.GSElectricityEmission || mongoose.model("GSElectricityEmission", GSElectricityEmissionModel);