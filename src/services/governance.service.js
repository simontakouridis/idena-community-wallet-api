const httpStatus = require('http-status');
const { User, DraftWallet, Wallet, Proposal, DraftTransaction, Transaction } = require('../models');
const ApiError = require('../utils/ApiError');
const externalService = require('./external.service');
const { proposalTypes } = require('../config/proposal');

/**
 * WALLET FUNCTIONS
 */

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
 * Get wallet by id
 * @param {ObjectId} id
 * @returns {Promise<Wallet>}
 */
const getWalletById = async (id) => {
  return Wallet.findById(id);
};

/**
 * DRAFT WALLET FUNCTIONS
 */

/**
 * Validates a new multisig wallet
 * @param {Object} draftWalletBody
 * @returns {Promise<Any>}
 */
const validateNewMultisigWallet = async (draftWalletBody) => {
  if (await DraftWallet.isAddressTaken(draftWalletBody.address)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Draft wallet address already taken');
  }
  if (await DraftWallet.isAuthorPresent(draftWalletBody.author)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Author already has a draft wallet');
  }
  const contractData = await externalService.getContract(draftWalletBody.address);
  if (
    contractData.address.toLowerCase() !== draftWalletBody.address ||
    contractData.type !== 'Multisig' ||
    contractData.author.toLowerCase() !== draftWalletBody.author
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Data inconsistency with new contract');
  }
  const multisigContractData = await externalService.getMultisigContract(draftWalletBody.address);
  if (multisigContractData.minVotes !== 3 || multisigContractData.maxVotes !== 5 || multisigContractData.signers) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Data inconsistency with new multisig contract');
  }
};

/**
 * Create a draft wallet
 * @param {Object} draftWalletBody
 * @returns {Promise<DraftWallet>}
 */
const createDraftWallet = async (draftWalletBody) => {
  return DraftWallet.create(draftWalletBody);
};

/**
 * Validates a new signer for multisig wallet
 * @param {Object} newSignerBody
 * @returns {Promise<Array>}
 */
const validateNewSignerForDraftWallet = async (newSignerBody) => {
  const draftWallet = await DraftWallet.findOne({ author: newSignerBody.author });
  if (!draftWallet) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Non-activated draft wallet does not exist for this user');
  }
  if (draftWallet.address !== newSignerBody.contract) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Draft wallet address not consistent with supplied address');
  }
  if (draftWallet.signers.length >= 5) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Draft wallet has reached its max number of signers');
  }
  if (draftWallet.signers.includes(newSignerBody.signer)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Draft wallet already possesses this signer');
  }
  const multisigContractData = await externalService.getMultisigContract(draftWallet.address);
  if (!multisigContractData.signers) {
    throw new ApiError(httpStatus.FORBIDDEN, 'No signers on multisig contract');
  }
  const multisigSigner = multisigContractData.signers.find((signer) => signer.address === newSignerBody.signer);
  if (!multisigSigner) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Signer not present on multisig contract');
  }
  const multisigSignersLessSigner = multisigContractData.signers.filter((signer) => signer.address !== newSignerBody.signer);
  if (
    multisigSignersLessSigner.length !== draftWallet.signers.length ||
    !multisigSignersLessSigner.every((signerA) => draftWallet.signers.some((signerB) => signerB === signerA.address))
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Draft wallet signers inconsistent with multisig signers');
  }

  return draftWallet.signers;
};

/**
 * Add signer to draft wallet
 * @param {Object} newSignerBody
 * @returns {Promise<DraftWallet>}
 */
const addSignerToDraftWallet = async (newSignerBody, signers) => {
  return DraftWallet.findOneAndUpdate(
    { address: newSignerBody.contract, signers: { ...(signers.length && { $all: signers }), $size: signers.length } },
    { $addToSet: { signers: newSignerBody.signer } },
    { useFindAndModify: false }
  );
};

/**
 * Query for draft wallets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryDraftWallets = async (filter, options) => {
  const draftWallets = await DraftWallet.paginate(filter, options);
  return draftWallets;
};

/**
 * Get draft wallet by id
 * @param {ObjectId} id
 * @returns {Promise<DraftWallet>}
 */
const getDraftWalletById = async (id) => {
  return DraftWallet.findById(id);
};

/**
 * Activate draft wallet by id
 * @param {ObjectId} draftWalletId
 * @returns {Promise<Wallet>}
 */
const activateDraftWallet = async (draftWalletId) => {
  try {
    const draftWallet = await getDraftWalletById(draftWalletId);
    if (!draftWallet) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Draft wallet not found');
    }
    if (draftWallet.signers.length < 5) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Draft wallet does not have enough signers');
    }
    if (await Wallet.isAddressTaken(draftWallet.address)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Wallet address already taken');
    }
    const currentWallet = await getCurrentWallet();
    const wallet = new Wallet({
      address: draftWallet.address,
      author: draftWallet.author,
      signers: draftWallet.signers,
      round: currentWallet ? currentWallet.round + 1 : 1,
    });
    const updatePromises = [];
    updatePromises.push(draftWallet.remove());
    updatePromises.push(wallet.save());
    for (let i = 0; i < wallet.signers.length; i++) {
      updatePromises.push(User.updateOne({ address: wallet.signers[i] }, { role: 'admin', $addToSet: { wallets: wallet._id } }, { upsert: true }));
    }
    await Promise.all(updatePromises);

    return wallet;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Error with activate wallet ${error}`);
  }
};

/**
 * Delete draft wallet by id
 * @param {ObjectId} draftWalletId
 * @returns {Promise<DraftWallet>}
 */
const deleteDraftWallet = async (draftWalletId) => {
  const draftWallet = await DraftWallet.findByIdAndDelete(draftWalletId);
  if (!draftWallet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Draft wallet for delete not found');
  }
  return draftWallet;
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
  const currentWallet = await getCurrentWallet();
  const updatedBody = {
    ...proposalBody,
    wallet: currentWallet._id,
    acceptanceStatus: proposalTypes.acceptanceStatus.PENDING,
    fundingStatus: proposalTypes.fundingStatus.PENDING,
  };
  return Proposal.create(updatedBody);
};

/**
 * Edit a proposal
 * @param {string} proposalId
 * @param {Object} proposalBody
 * @returns {Promise<Proposal>}
 */
const editProposal = async (proposalId, proposalBody) => {
  const proposal = await Proposal.findByIdAndUpdate(proposalId, proposalBody);
  if (!proposal) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Proposal for edit not found');
  }
  return proposal;
};

/**
 * Delete a proposal
 * @param {string} proposalId
 * @returns {Promise<Proposal>}
 */
const deleteProposal = async (proposalId) => {
  const proposal = await Proposal.findByIdAndDelete(proposalId);
  if (!proposal) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Proposal for delete not found');
  }
  return proposal;
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
 * Get proposal by id
 * @param {ObjectId} id
 * @returns {Promise<Proposal>}
 */
const getProposalById = async (id) => {
  return Proposal.findById(id);
};

/**
 * TRANSACTION FUNCTIONS
 */

/**
 * Create a draft transaction
 * @param {Object} draftTransactionBody
 * @returns {Promise<DraftTransaction>}
 */
const createDraftTransaction = async (draftTransactionBody) => {
  return DraftTransaction.create(draftTransactionBody);
};

/**
 * Validates a new signer for transaction
 * @param {Object} newSignerBody
 * @returns {Promise<Any>}
 */
const validateNewSignerForDraftTransaction = async (newSignerBody) => {
  const draftTransaction = await DraftTransaction.findById(newSignerBody.transaction);
  if (draftTransaction.sends.includes(newSignerBody.signer)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Draft transaction already signed by this signer');
  }

  const wallet = await getWalletById(draftTransaction.wallet);
  const multisigContractData = await externalService.getMultisigContract(wallet.address);

  const newSigner = multisigContractData.signers.find(
    (signer) =>
      signer.address === newSignerBody.signer && signer.destAddress === draftTransaction.recipient && Number(signer.amount) === draftTransaction.amount
  );
  if (!newSigner) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Signer not present for transaction on multisig wallet');
  }
};

/**
 * Sign a draft transaction
 * @param {Object} signTransactionBody
 * @param {Object} user
 * @returns {Promise<DraftTransaction>}
 */
const signDraftTransaction = async (signTransactionBody, user) => {
  return DraftTransaction.findByIdAndUpdate(signTransactionBody.transaction, { $addToSet: { sends: user.address } });
};

/**
 * Query for draft transactions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryDraftTransactions = async (filter, options) => {
  const draftTransactions = await DraftTransaction.paginate(filter, options);
  return draftTransactions;
};

/**
 * Get draft transaction by id
 * @param {ObjectId} id
 * @returns {Promise<DraftTransaction>}
 */
const getDraftTransactionById = async (id) => {
  return DraftTransaction.findById(id);
};

/**
 * Validates execution for transaction
 * @param {ObjectId} draftTransactionId
 * @param {string} tx
 * @returns {Promise<Any>}
 */
const validateExecutionOfDraftTransaction = async (draftTransactionId, tx) => {
  const draftTransaction = await DraftTransaction.findById(draftTransactionId);
  if (draftTransaction.sends.length < 3) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Draft transaction has insufficient signers');
  }

  const wallet = await getWalletById(draftTransaction.wallet);
  const multisigContractData = await externalService.getMultisigContract(wallet.address);

  const signers = multisigContractData.signers.filter((signer) => signer.destAddress === draftTransaction.recipient && Number(signer.amount) === 0);
  if (signers.length < 3) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Multisig wallet data is inconsistent with recent push');
  }

  const addressContractBalancesData = await externalService.getAddressContractBalances(draftTransaction.recipient, wallet.address, { limit: 1 });
  if (!addressContractBalancesData.length) {
    throw new ApiError(httpStatus.FORBIDDEN, 'No recent pushes found');
  }
  const lastestAddressContractBalancesItem = addressContractBalancesData[0];
  if (
    lastestAddressContractBalancesItem.hash !== tx ||
    lastestAddressContractBalancesItem.contractType !== 'Multisig' ||
    Number(lastestAddressContractBalancesItem.balanceChange) !== draftTransaction.amount ||
    lastestAddressContractBalancesItem.txReceipt.success !== true ||
    lastestAddressContractBalancesItem.txReceipt.method !== 'push'
  ) {
    throw new Error('Latest recipient contract balance data inconsistency');
  }
};

/**
 * Execute draft transaction by id
 * @param {ObjectId} draftTransactionId
 * @param {string} userAddress
 * @param {string} tx
 * @returns {Promise<Transaction>}
 */
const executeDraftTransaction = async (draftTransactionId, userAddress, tx) => {
  try {
    const draftTransaction = await getDraftTransactionById(draftTransactionId);
    if (!draftTransaction) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Draft transaction not found');
    }
    if (draftTransaction.sends.length < 3) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Draft transaction does not have enough sends');
    }

    const transaction = new Transaction({
      title: draftTransaction.title,
      category: draftTransaction.category,
      ...(draftTransaction.categoryOtherDescription && { categoryOtherDescription: draftTransaction.categoryOtherDescription }),
      ...(draftTransaction.proposal && { proposal: draftTransaction.proposal }),
      wallet: draftTransaction.wallet,
      recipient: draftTransaction.recipient,
      amount: draftTransaction.amount,
      sends: draftTransaction.sends,
      push: userAddress,
      tx,
    });

    const updatePromises = [];
    updatePromises.push(draftTransaction.remove());
    updatePromises.push(transaction.save());
    updatePromises.push(Wallet.updateOne({ _id: draftTransaction.wallet }, { $addToSet: { transactions: transaction._id } }));
    if (draftTransaction.proposal) {
      updatePromises.push(Proposal.updateOne({ _id: draftTransaction.proposal }, { $addToSet: { transactions: transaction._id } }));
    }
    await Promise.all(updatePromises);

    return transaction;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Error with execute draft transaction ${error}`);
  }
};

/**
 * Delete draft transaction by id
 * @param {ObjectId} draftTransactionId
 * @returns {Promise<DraftTransaction>}
 */
const deleteDraftTransaction = async (draftTransactionId) => {
  const draftTransaction = await DraftTransaction.findByIdAndDelete(draftTransactionId);
  if (!draftTransaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Draft transction for delete not found');
  }
  return draftTransaction;
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
  validateNewMultisigWallet,
  createDraftWallet,
  validateNewSignerForDraftWallet,
  addSignerToDraftWallet,
  queryDraftWallets,
  getDraftWalletById,
  activateDraftWallet,
  deleteDraftWallet,
  queryWallets,
  getCurrentWallet,
  getWalletById,
  createProposal,
  editProposal,
  deleteProposal,
  queryProposals,
  getProposalById,
  createDraftTransaction,
  validateNewSignerForDraftTransaction,
  signDraftTransaction,
  queryDraftTransactions,
  getDraftTransactionById,
  validateExecutionOfDraftTransaction,
  executeDraftTransaction,
  deleteDraftTransaction,
  queryTransactions,
};
