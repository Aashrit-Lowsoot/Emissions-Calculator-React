const mongoose = require("mongoose");

const GSTravelEmissionSchema = new mongoose.Schema({
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
    
    companyId: {
        type: String,
        required: [true, "Please provide the company id!"],
    },
});

module.exports = mongoose.model.GSTravelEmission || mongoose.model("GSTravelEmission", GSTravelEmissionSchema);