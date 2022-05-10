const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { idenaAuthStatusTypes } = require('../config/idenaAuth');

const idenaAuthSchema = mongoose.Schema(
  {
    idenaAuthToken: {
      type: String,
      required: true,
      index: { unique: true },
    },
    userAddress: {
      type: String,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [idenaAuthStatusTypes.ISSUED, idenaAuthStatusTypes.SUCCESS, idenaAuthStatusTypes.FAIL],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
idenaAuthSchema.plugin(toJSON);

/**
 * @typedef IdenaAuth
 */
const IdenaAuth = mongoose.model('IdenaAuth', idenaAuthSchema);

module.exports = IdenaAuth;
