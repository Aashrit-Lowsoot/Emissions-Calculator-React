const mongoose = require("mongoose");

const GSDeliveryEmissionSchema = new mongoose.Schema({
    numberOfItems: {
        type: Number,
        required: [true, "Please provide the no. of items!"],
    },

    type: {
        type: String,
        required: [true, "Please provide the product type!"],
    },

    destinationCity: {
        type: String,
        required: [true, "Please provide the destination city!"],
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
        default: false,
    },

    companyId: {
        type: String,
        required: [true, "Please provide the company id!"],
    },
});

module.exports = mongoose.model.GSDeliveryEmission || mongoose.model("GSDeliveryEmission", GSDeliveryEmissionSchema);