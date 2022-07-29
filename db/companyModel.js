const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
    },

    companyId: {
        type: String,
    },

    logo: {
        type: String,
    },
});

module.exports = mongoose.model.Company || mongoose.model("Company", CompanySchema);