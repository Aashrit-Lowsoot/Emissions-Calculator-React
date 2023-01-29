const mongoose = require("mongoose");

const GSProductEmissionSchema = new mongoose.Schema({
    
    numberOfItems: {
        type: Number,
        required: [true, "Please provide the no. of items!"],
    },

    type: {
        type: String,
        required: [true, "Please provide the product type!"],
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

module.exports = mongoose.model.GSProductEmission || mongoose.model("GSProductEmission", GSProductEmissionSchema);