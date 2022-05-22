const httpStatus = require('http-status');
const { Wallet, Proposal, Transaction } = require('../models');
const ApiError = require('../utils/ApiError');

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
  queryWallets,
  getCurrentWallet,
  createProposal,
  queryProposals,
  createTransaction,
  queryTransactions,
};
