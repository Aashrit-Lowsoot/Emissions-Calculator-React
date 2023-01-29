const mongoose = require("mongoose");

const BuildingEmissionSchema = new mongoose.Schema({
    
    buildingSpace: {
        type: Number,
        required: [true, "Please provide the building space!"],
    },

    warehouseSpace: {
        type: Number,
        required: [true, "Please provide the warehouse space!"],
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

module.exports = mongoose.model.BuildingEmission || mongoose.model("BuildingEmission", BuildingEmissionSchema);