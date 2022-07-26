const mongoose = require("mongoose");

const GoogleSheetsModel = new mongoose.Schema({
    companyId: {
        type: String,
        required: [true, "Please provide the company id!"],
    },

    sheetsId: {
        type: String,
        required: [true, "Please provide the sheets id!"],
    },
});

module.exports = mongoose.model.GoogleSheets || mongoose.model("GoogleSheets", GoogleSheetsModel);