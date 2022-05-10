const httpStatus = require('http-status');
const { bufferToHex, ecrecover, fromRpcSig, keccak256, pubToAddress } = require('ethereumjs-util');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const IdenaAuth = require('../models/idenaAuth.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { idenaAuthStatusTypes, idenaAuthExpiresMinutes } = require('../config/idenaAuth');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

/**
 * Start Session
 * @param {string} idenaAuthToken
 * @param {string} address
 * @returns {Promise<string>}
 */
const startSession = async (idenaAuthToken, userAddress) => {
  const nonce = `signin-${uuidv4()}`;
  const idenaAuthTokenExpires = moment().add(idenaAuthExpiresMinutes, 'minutes');
  try {
    await IdenaAuth.create({
      idenaAuthToken,
      userAddress,
      nonce,
      expires: idenaAuthTokenExpires.toDate(),
      status: idenaAuthStatusTypes.ISSUED,
    });
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This is a error message');
  }
  return nonce;
};

/**
 * Get idenaAuthDoc
 * @param {string} idenaAuthToken
 * @returns {Promise}
 */
const getIdenaAuthDoc = async (idenaAuthToken) => {
  let idenaAuthDoc;

  try {
    idenaAuthDoc = await IdenaAuth.findOne({ idenaAuthToken, status: idenaAuthStatusTypes.ISSUED });
    if (!idenaAuthDoc || new Date(idenaAuthDoc.expires).getTime() < new Date().getTime()) {
      throw new Error();
    }
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This is a error message');
  }
  return idenaAuthDoc;
};

/**
 * Verify Authenticated
 * @param {string} nonce
 * @param {string} address
 * @param {string} signature
 * @returns {bool}
 */
const verifyAuthenticated = (nonce, address, signature) => {
  const nonceHash = keccak256(keccak256(Buffer.from(nonce, 'utf-8')));
  const { v, r, s } = fromRpcSig(signature);
  const pubKey = ecrecover(nonceHash, v, r, s);
  const addrBuf = pubToAddress(pubKey);
  const signatureAddress = bufferToHex(addrBuf);
  return signatureAddress === address;
};

/**
 * Update idenaAuthDoc
 * @param {string} idenaAuthToken
 * @returns {Promise}
 */
const updateIdenaAuthDoc = async (idenaAuthToken, authenticated) => {
  try {
    await IdenaAuth.updateOne({ idenaAuthToken }, { status: authenticated ? idenaAuthStatusTypes.SUCCESS : idenaAuthStatusTypes.FAIL });
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This is a error message');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  startSession,
  getIdenaAuthDoc,
  verifyAuthenticated,
  updateIdenaAuthDoc,
};
