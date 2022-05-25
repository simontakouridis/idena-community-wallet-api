const Joi = require('joi');
const { validateAddress } = require('./custom.validation');
const { proposalTypes } = require('../config/proposal');
const { transactionTypes } = require('../config/transaction');

const createWallet = {
  body: Joi.object().keys({
    address: Joi.string().required().custom(validateAddress),
    author: Joi.string().required().custom(validateAddress),
  }),
};

const getWallets = {
  query: Joi.object().keys({
    round: Joi.string(),
    address: Joi.string().custom(validateAddress),
    author: Joi.string().custom(validateAddress),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const createProposal = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string(),
    oracle: Joi.string().custom(validateAddress),
    wallet: Joi.string().min(24).max(24),
    accepted: Joi.string().valid(proposalTypes.accepted.PENDING, proposalTypes.accepted.YES, proposalTypes.accepted.NO),
    status: Joi.string().valid(proposalTypes.status.PENDING, proposalTypes.status.FUNDED, proposalTypes.status.UNFUNDED),
    transaction: Joi.string().min(24).max(24),
  }),
};

const getProposals = {
  query: Joi.object().keys({
    title: Joi.string(),
    oracle: Joi.string(),
    wallet: Joi.string(),
    accepted: Joi.string(),
    status: Joi.string(),
    transaction: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const createTransaction = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    category: Joi.string().required().valid(transactionTypes.FUND_PROPOSAL, transactionTypes.TRANSFER_TO_NEW_WALLET, transactionTypes.PAY_FOR_ORACLE),
    proposal: Joi.string().min(24).max(24),
    newWallet: Joi.string().min(24).max(24),
    wallet: Joi.string().min(24).max(24).required(),
    recipient: Joi.string().required().custom(validateAddress),
    amount: Joi.number().required(),
  }),
};

const getTransactions = {
  query: Joi.object().keys({
    title: Joi.string(),
    category: Joi.string(),
    proposal: Joi.string(),
    newWallet: Joi.string(),
    wallet: Joi.string(),
    recipient: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  createWallet,
  getWallets,
  createProposal,
  getProposals,
  createTransaction,
  getTransactions,
};
