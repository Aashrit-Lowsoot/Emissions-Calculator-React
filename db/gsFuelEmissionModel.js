const mongoose = require("mongoose");

const GSFuelEmissionModel = new mongoose.Schema({
  money: {
    type: Number,
    default: 1,
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

module.exports =
  mongoose.model.GSFuelEmission ||
  mongoose.model("GSFuelEmission", GSFuelEmissionModel);
