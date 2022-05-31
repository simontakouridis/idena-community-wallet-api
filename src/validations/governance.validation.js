const Joi = require('joi');
const { validateAddress, objectId } = require('./custom.validation');
const { transactionTypes } = require('../config/transaction');
const { proposalTypes } = require('../config/proposal');

const createDraftWallet = {
  body: Joi.object().keys({
    address: Joi.string().required().custom(validateAddress),
  }),
};

const addSigner = {
  body: Joi.object().keys({
    signer: Joi.string().required().custom(validateAddress),
    contract: Joi.string().required().custom(validateAddress),
  }),
};

const getDraftWallets = {
  query: Joi.object().keys({
    address: Joi.string().custom(validateAddress),
    author: Joi.string().custom(validateAddress),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const activateDraftWallet = {
  params: Joi.object().keys({
    draftWalletId: Joi.string().required().custom(objectId),
  }),
};

const deleteDraftWallet = {
  params: Joi.object().keys({
    draftWalletId: Joi.string().required().custom(objectId),
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
  }),
};

const getProposals = {
  query: Joi.object().keys({
    title: Joi.string(),
    oracle: Joi.string(),
    wallet: Joi.string(),
    acceptanceStatus: Joi.string().valid(
      proposalTypes.acceptanceStatus.PENDING,
      proposalTypes.acceptanceStatus.ACCEPTED,
      proposalTypes.acceptanceStatus.REJECTED
    ),
    fundingStatus: Joi.string().valid(proposalTypes.fundingStatus.PENDING, proposalTypes.fundingStatus.FUNDED, proposalTypes.fundingStatus.UNFUNDED),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const editProposal = {
  body: Joi.object().keys({
    title: Joi.string(),
    description: Joi.string(),
    oracle: Joi.string().custom(validateAddress),
    acceptanceStatus: Joi.string().valid(
      proposalTypes.acceptanceStatus.PENDING,
      proposalTypes.acceptanceStatus.ACCEPTED,
      proposalTypes.acceptanceStatus.REJECTED
    ),
    fundingStatus: Joi.string().valid(proposalTypes.fundingStatus.PENDING, proposalTypes.fundingStatus.FUNDED, proposalTypes.fundingStatus.UNFUNDED),
    transactions: Joi.array().unique().items(Joi.string().min(24).max(24)),
  }),
};

const deleteProposal = {
  params: Joi.object().keys({
    proposalId: Joi.string().required().custom(objectId),
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
  createDraftWallet,
  addSigner,
  getDraftWallets,
  activateDraftWallet,
  deleteDraftWallet,
  getWallets,
  createProposal,
  getProposals,
  editProposal,
  deleteProposal,
  createTransaction,
  getTransactions,
};
