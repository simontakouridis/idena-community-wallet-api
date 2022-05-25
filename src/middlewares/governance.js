const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const governanceService = require('../services/governance.service');
const userService = require('../services/user.service');

// authentication middleware must be invoked prior to this middleware
const adminOfWalletOnly = (req, res, next) => {
  const {
    user,
    body: { wallet: walletId },
  } = req;
  const isUserSignatory = user.wallets.find((wallet) => wallet === walletId);
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of wallet');
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
  const isUserSignatory = user.wallets.find((wallet) => wallet === currentWallet.id);
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of current wallet');
  }
  return next();
};

// authentication middleware must be invoked prior to this middleware
const adminOfCurrentWalletOrSoleAdminOnly = async (req, res, next) => {
  const { user } = req;
  const currentWallet = await governanceService.getCurrentWallet();
  console.log('1');
  if (!currentWallet) {
    console.log('2');
    const adminCount = await userService.getAdminUserCount();
    console.log('3');
    if (adminCount === 1) {
      console.log('4');
      return next();
    }
    console.log('5');
    throw new ApiError(httpStatus.NOT_FOUND, 'Current wallet not found, and more than 1 admin');
  }
  const isUserSignatory = user.wallets.find((wallet) => wallet === currentWallet.id);
  if (!isUserSignatory) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not admin of current wallet');
  }
  return next();
};

module.exports = {
  adminOfWalletOnly,
  adminOfCurrentWalletOnly,
  adminOfCurrentWalletOrSoleAdminOnly,
};
