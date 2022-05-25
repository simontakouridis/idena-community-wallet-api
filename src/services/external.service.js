const axios = require('axios');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

/**
 * get contract details from idena api
 * @param {Object} walletBody
 * @returns {Promise<Any>}
 */
const getContract = async (contract) => {
  const response = await axios.get(`${config.idena.apiUrl}/Contract/${contract}`);
  if (!response || response.status !== 200 || !response.data || !response.data.result) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Error getting contract data');
  }
  return response.data.result;
};

/**
 * get multisig contract details from idena api
 * @param {Object} walletBody
 * @returns {Promise<Any>}
 */
const getMultisigContract = async (contract) => {
  const response = await axios.get(`${config.idena.apiUrl}/MultisigContract/${contract}`);
  if (!response || response.status !== 200 || !response.data || !response.data.result) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Error getting multisig contract data');
  }
  return response.data.result;
};

module.exports = {
  getContract,
  getMultisigContract,
};
