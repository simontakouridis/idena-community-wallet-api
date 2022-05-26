const mongoose = require('mongoose');
const { isValidAddress } = require('ethereumjs-util');
const { toJSON, paginate } = require('./plugins');

const draftWalletSchema = mongoose.Schema(
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
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
draftWalletSchema.plugin(toJSON);
draftWalletSchema.plugin(paginate);

/**
 * Check if address is taken
 * @param {string} address - The wallet address
 * @returns {Promise<boolean>}
 */
draftWalletSchema.statics.isAddressTaken = async function (address) {
  const wallet = await this.findOne({ address });
  return !!wallet;
};

/**
 * Check if author is already present
 * @param {string} author - The authors' address
 * @returns {Promise<boolean>}
 */
draftWalletSchema.statics.isAuthorPresent = async function (author) {
  const wallet = await this.findOne({ author });
  return !!wallet;
};

/**
 * @typedef DraftWallet
 */
const DraftWallet = mongoose.model('DraftWallet', draftWalletSchema);

module.exports = DraftWallet;
