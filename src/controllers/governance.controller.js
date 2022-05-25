const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { governanceService } = require('../services');

const createWallet = catchAsync(async (req, res) => {
  const wallet = await governanceService.createWallet(req.body);
  res.status(httpStatus.CREATED).send(wallet);
});

const getWallets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['address', 'author', 'round']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryWallets(filter, options);
  res.send(result);
});

const createProposal = catchAsync(async (req, res) => {
  const proposal = await governanceService.createProposal(req.body);
  res.status(httpStatus.CREATED).send(proposal);
});

const getProposals = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'oracle', 'wallet', 'accepted', 'status', 'transaction']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryProposals(filter, options);
  res.send(result);
});

const createTransaction = catchAsync(async (req, res) => {
  const transaction = await governanceService.createTransaction(req.body);
  res.status(httpStatus.CREATED).send(transaction);
});

const getTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'category', 'proposal', 'newWallet', 'wallet', 'recipient']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryTransactions(filter, options);
  res.send(result);
});

module.exports = {
  createWallet,
  getWallets,
  createProposal,
  getProposals,
  createTransaction,
  getTransactions,
};
