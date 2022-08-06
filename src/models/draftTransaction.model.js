const mongoose = require('mongoose');
const { isValidAddress } = require('ethereumjs-util');
const { toJSON, paginate } = require('./plugins');
const { transactionTypes } = require('../config/transaction');

const draftTransactionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        transactionTypes.PAY_FOR_ORACLE,
        transactionTypes.FUND_PROPOSAL,
        transactionTypes.SETUP_NEW_WALLET,
        transactionTypes.TRANSFER_FUNDS_TO_NEW_WALLET,
        transactionTypes.DELEGATE_REWARDS,
        transactionTypes.OTHER,
      ],
      required: true,
    },
    categoryOtherDescription: {
      type: String,
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      unique: true,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!isValidAddress(value)) {
          throw new Error('Invalid recipient address');
        }
      },
    },
    amount: {
      type: Number,
      required: true,
    },
    sends: {
      type: [
        {
          type: String,
          lowercase: true,
          validate(value) {
            if (!isValidAddress(value)) {
              throw new Error('Invalid signer address for send');
            }
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
draftTransactionSchema.plugin(toJSON);
draftTransactionSchema.plugin(paginate);

/**
 * @typedef DraftTransaction
 */
const DraftTransaction = mongoose.model('DraftTransaction', draftTransactionSchema);

module.exports = DraftTransaction;
