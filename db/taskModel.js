const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  emissionType: {
    type: String,
    required: [true, "Please provide the emission type!"],
  },

  emissionTillDate: {
    type: Number,
    required: [true, "Please provide the emission till date!"],
  },

  startDate: {
    type: Date,
    required: [true, "Please provide the start date!"],
  },

  endDate: {
    type: Date,
    required: [true, "Please provide the end date!"],
  },

  carbonSaveGoal: {
    type: Number,
    required: [true, "Please provide the carbon save goal!"],
  },

  amount: {
    type: Number,
    required: [true, "Please provide the amount!"],
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

module.exports =
  mongoose.model.TaskModel || mongoose.model("TaskModel", TaskSchema);
