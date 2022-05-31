const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { governanceService } = require('../services');

const createDraftWallet = catchAsync(async (req, res) => {
  req.body.author = req.user.address;
  await governanceService.validateNewMultisigWallet(req.body);
  const draftWallet = await governanceService.createDraftWallet(req.body);
  res.status(httpStatus.CREATED).send(draftWallet);
});

const getDraftWallets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['address', 'author']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryDraftWallets(filter, options);
  res.send(result);
});

const getWallets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['address', 'author', 'round']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryWallets(filter, options);
  res.send(result);
});

const addSigner = catchAsync(async (req, res) => {
  req.body.author = req.user.address;
  const signers = await governanceService.validateNewSignerForDraftWallet(req.body);
  const draftWallet = await governanceService.addSignerToDraftWallet(req.body, signers);
  res.send(draftWallet);
});

const activateDraftWallet = catchAsync(async (req, res) => {
  const wallet = await governanceService.activateDraftWallet(req.params.draftWalletId);
  res.send(wallet);
});

const deleteDraftWallet = catchAsync(async (req, res) => {
  await governanceService.deleteDraftWallet(req.params.draftWalletId);
  res.status(httpStatus.NO_CONTENT).send();
});

const createProposal = catchAsync(async (req, res) => {
  const proposal = await governanceService.createProposal(req.body);
  res.status(httpStatus.CREATED).send(proposal);
});

const editProposal = catchAsync(async (req, res) => {
  const proposal = await governanceService.editProposal(req.params.proposalId, req.body);
  res.send(proposal);
});

const deleteProposal = catchAsync(async (req, res) => {
  await governanceService.deleteProposal(req.params.proposalId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getProposals = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'oracle', 'wallet', 'acceptanceStatus', 'fundingStatus']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryProposals(filter, options);
  res.send(result);
});

const createTransaction = catchAsync(async (req, res) => {
  const transaction = await governanceService.createTransaction(req.body);
  res.status(httpStatus.CREATED).send(transaction);
});

const getTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'category', 'proposal', 'wallet', 'recipient']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryTransactions(filter, options);
  res.send(result);
});

module.exports = {
  createDraftWallet,
  getDraftWallets,
  getWallets,
  addSigner,
  activateDraftWallet,
  deleteDraftWallet,
  createProposal,
  editProposal,
  deleteProposal,
  getProposals,
  createTransaction,
  getTransactions,
};
