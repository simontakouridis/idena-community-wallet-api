const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const governanceService = require('../services/governance.service');
const userService = require('../services/user.service');
const { DraftWallet, Proposal, DraftTransaction } = require('../models');

// authentication middleware must be invoked prior to this middleware
const authorOfDraftWalletOnly = async (req, res, next) => {
  const {
    user,
    params: { draftWalletId },
  } = req;
  const draftWallet = await DraftWallet.findById(draftWalletId);
  if (!draftWallet || draftWallet.author !== user.address) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not author of draft wallet');
  }
  return next();
};

// authentication middleware must be invoked prior to this middleware
const adminOfWalletOnly = (req, res, next) => {
  const {
    user,
    body: { wallet: walletId },
  } = req;
  const isUserSignatory = user.wallets.find((wallet) => wallet.equals(walletId));
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of wallet');
  }
  return next();
};

// authentication middleware must be invoked prior to this middleware
const adminOfProposalWalletOnly = async (req, res, next) => {
  const {
    user,
    params: { proposalId },
  } = req;
  const proposal = await Proposal.findById(proposalId);
  const walletId = proposal.wallet;
  const isUserSignatory = user.wallets.find((wallet) => wallet.equals(walletId));
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of proposal wallet');
  }
  return next();
};

// authentication middleware must be invoked prior to this middleware
const adminOfDraftTransactionWalletOnly = async (req, res, next) => {
  const {
    user,
    params: { draftTransactionId },
    body: { transaction },
  } = req;

  const draftTransaction = await DraftTransaction.findById(draftTransactionId || transaction);
  const walletId = draftTransaction.wallet;
  const isUserSignatory = user.wallets.find((wallet) => wallet.equals(walletId));
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of draft transaction wallet');
  }
  return next();
};

// authentication middleware must be invoked prior to this middleware
const adminOfCurrentWalletOnly = async (req, res, next) => {
  const { user } = req;
  const currentWallet = await governanceService.getCurrentWallet();
  if (!currentWallet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Current wallet not found');
  }
  const isUserSignatory = user.wallets.find((wallet) => wallet.equals(currentWallet._id));
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of current wallet');
  }
  return next();
};

// authentication middleware must be invoked prior to this middleware
const adminOfCurrentWalletOrSoleAdminOnly = async (req, res, next) => {
  const { user } = req;
  const currentWallet = await governanceService.getCurrentWallet();
  if (!currentWallet) {
    const adminCount = await userService.getAdminUserCount();
    if (adminCount === 1) {
      return next();
    }
    throw new ApiError(httpStatus.NOT_FOUND, 'Current wallet not found, and more than 1 admin');
  }
  const isUserSignatory = user.wallets.find((wallet) => wallet.equals(currentWallet._id));
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of current wallet');
  }
  return next();
};

module.exports = {
  authorOfDraftWalletOnly,
  adminOfWalletOnly,
  adminOfProposalWalletOnly,
  adminOfDraftTransactionWalletOnly,
  adminOfCurrentWalletOnly,
  adminOfCurrentWalletOrSoleAdminOnly,
};
