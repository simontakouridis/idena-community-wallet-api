const mongoose = require('mongoose');
const { isValidAddress } = require('ethereumjs-util');
const { toJSON, paginate } = require('./plugins');
const { proposalTypes } = require('../config/proposal');

const proposalSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    oracle: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!isValidAddress(value)) {
          throw new Error('Invalid oracle address');
        }
      },
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    acceptanceStatus: {
      type: String,
      enum: [proposalTypes.acceptanceStatus.PENDING, proposalTypes.acceptanceStatus.ACCEPTED, proposalTypes.acceptanceStatus.REJECTED],
      required: true,
    },
    fundingStatus: {
      type: String,
      enum: [proposalTypes.fundingStatus.PENDING, proposalTypes.fundingStatus.FUNDED, proposalTypes.fundingStatus.UNFUNDED],
      required: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
proposalSchema.plugin(toJSON);
proposalSchema.plugin(paginate);

/**
 * @typedef Proposal
 */
const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
