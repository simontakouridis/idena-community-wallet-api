const httpStatus = require('http-status');
const { Wallet, Proposal, Transaction } = require('../models');
const ApiError = require('../utils/ApiError');
const externalService = require('./external.service');

/**
 * WALLET FUNCTIONS
 */

/**
 * Create a wallet
 * @param {Object} walletBody
 * @returns {Promise<Wallet>}
 */
const createWallet = async (walletBody) => {
  if (await Wallet.isAddressTaken(walletBody.address)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Wallet address already taken');
  }
  return Wallet.create(walletBody);
};

/**
 * Validates a new multisig wallet
 * @param {Object} walletBody
 * @returns {Promise<Any>}
 */
const validateNewMultisigWallet = async (walletBody) => {
  if (await Wallet.find({ author: walletBody.author, round: 0 })) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Non-activated wallet already existing for this user');
  }

  const contractData = await externalService.getContract(walletBody.address);
  if (
    contractData.address.toLowerCase() !== walletBody.address ||
    contractData.type !== 'Multisig' ||
    contractData.author.toLowerCase() !== walletBody.author
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Data inconsistency with new contract');
  }

  const multisigContractData = await externalService.getMultisigContract(walletBody.address);
  if (multisigContractData.minVotes !== 3 || multisigContractData.maxVotes !== 5 || multisigContractData.signers) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Data inconsistency with new multisig contract');
  }
};

/**
 * Query for wallets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryWallets = async (filter, options) => {
  const wallets = await Wallet.paginate(filter, options);
  return wallets;
};

/**
 * Get current wallet
 * @returns {Promise<Wallet>}
 */
const getCurrentWallet = async () => {
  return Wallet.getCurrent();
};

/**
 * PROPOSAL FUNCTIONS
 */

/**
 * Create a proposal
 * @param {Object} proposalBody
 * @returns {Promise<Proposal>}
 */
const createProposal = async (proposalBody) => {
  return Proposal.create(proposalBody);
};

/**
 * Query for proposals
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProposals = async (filter, options) => {
  const proposals = await Proposal.paginate(filter, options);
  return proposals;
};

/**
 * TRANSACTION FUNCTIONS
 */

/**
 * Create a transaction
 * @param {Object} transactionBody
 * @returns {Promise<Transaction>}
 */
const createTransaction = async (transactionBody) => {
  return Transaction.create(transactionBody);
};

/**
 * Query for transactions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTransactions = async (filter, options) => {
  const transactions = await Transaction.paginate(filter, options);
  return transactions;
};

module.exports = {
  createWallet,
  validateNewMultisigWallet,
  queryWallets,
  getCurrentWallet,
  createProposal,
  queryProposals,
  createTransaction,
  queryTransactions,
};
