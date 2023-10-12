const { Schema, Types } = require("mongoose");

const CounterSchema = new Schema({
  orgId: {
    type: Types.ObjectId,
    unique: true,
    required: [true, "organisation id required"]
  },
  counter: {
    type: Number,
    default: 0,
    required: [true, "counter number required"]
  }
});

module.exports = { CounterSchema }
