const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { DraftWallet, Wallet, Proposal, Transaction } = require('../models');
const ApiError = require('../utils/ApiError');
const externalService = require('./external.service');
const { userService } = require('.');

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
 * Validates a new multisig wallet
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
    { $push: { signers: newSignerBody.signer } },
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

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    draftWallet.remove({ session });
    const currentWallet = await getCurrentWallet();
    const wallet = new Wallet({
      address: draftWallet.address,
      author: draftWallet.author,
      signers: draftWallet.signers,
      round: currentWallet ? currentWallet.round + 1 : 1,
    });
    await wallet.save({ session });

    const getUserPromises = [];
    for (let i = 0; i < wallet.signers.length; i++) {
      const signer = wallet.signers[i];
      getUserPromises.push(userService.getUserByAddress(signer));
    }
    const users = await Promise.all(getUserPromises);

    const updateUserPromises = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user) {
        user.role = 'admin';
        user.wallets.push(wallet.id);
        updateUserPromises.push(user.save({ session }));
      } else {
        updateUserPromises.push(
          userService.createUser(
            {
              name: 'unnamed',
              address: wallet.signers[i],
              role: 'admin',
              isAddressVerified: false,
              wallets: [wallet.address],
            },
            session
          )
        );
      }
    }
    await Promise.all(updateUserPromises);

    await session.commitTransaction();
    session.endSession();
    return wallet;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(httpStatus.BAD_REQUEST, `Error with activate wallet transaction: ${error}`);
  }
};

/**
 * Delete draft wallet by id
 * @param {ObjectId} draftWalletId
 * @returns {Promise<DraftWallet>}
 */
const deleteDraftWallet = async (draftWalletId) => {
  const draftWallet = await getDraftWalletById(draftWalletId);
  if (!draftWallet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Draft wallet not found');
  }
  await draftWallet.remove();
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
  createProposal,
  queryProposals,
  createTransaction,
  queryTransactions,
};
