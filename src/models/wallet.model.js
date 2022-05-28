const mongoose = require('mongoose');
const { isValidAddress } = require('ethereumjs-util');
const { toJSON, paginate } = require('./plugins');

const walletSchema = mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!isValidAddress(value)) {
          throw new Error('Invalid wallet address');
        }
      },
    },
    author: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!isValidAddress(value)) {
          throw new Error('Invalid wallet author address');
        }
      },
    },
    signers: {
      type: [
        {
          type: String,
          unique: true,
          trim: true,
          lowercase: true,
          validate(value) {
            if (!isValidAddress(value)) {
              throw new Error('Invalid signatory address');
            }
          },
        },
      ],
      required: true,
    },
    round: {
      type: Number,
      unique: true,
      required: true,
    },
    transactions: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', unique: true }],
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
walletSchema.plugin(toJSON);
walletSchema.plugin(paginate);

/**
 * Check if address is taken
 * @param {string} address - The wallet address
 * @returns {Promise<boolean>}
 */
walletSchema.statics.isAddressTaken = async function (address) {
  const wallet = await this.findOne({ address });
  return !!wallet;
};

/**
 * Get the current wallet
 * @returns {Promise<Wallet>}
 */
walletSchema.statics.getCurrent = async function () {
  const currentWallet = await this.find({ round: { $gte: 1 } })
    .sort({ round: -1 })
    .limit(1);
  return currentWallet[0];
};

/**
 * @typedef Wallet
 */
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
