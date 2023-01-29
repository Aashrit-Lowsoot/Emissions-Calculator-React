const mongoose = require("mongoose");

const TravelEmissionSchema = new mongoose.Schema({
    passengers: {
        type: Number,
        default: 1
    },

    distance: {
        type: Number,
        required: [true, "Please provide the dstance!"],
    },

    travelBy: {
        type: String,
        required: [true, "Please provide the travel by!"],
    },

    travelType: {
        type: String,
        required: [true, "Please provide the travel type!"],
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
        default: false,
    },

    companyId: {
        type: String,
        required: [true, "Please provide the company id!"],
    },
});

module.exports = mongoose.model.TravelEmission || mongoose.model("TravelEmission", TravelEmissionSchema);