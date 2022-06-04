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

const createDraftTransaction = catchAsync(async (req, res) => {
  const draftTransaction = await governanceService.createDraftTransaction(req.body);
  res.status(httpStatus.CREATED).send(draftTransaction);
});

const signDraftTransaction = catchAsync(async (req, res) => {
  req.body.signer = req.user.address;
  await governanceService.validateNewSignerForDraftTransaction(req.body);
  const draftTransaction = await governanceService.signDraftTransaction(req.body, req.user);
  res.send(draftTransaction);
});

const getDraftTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'category', 'proposal', 'wallet', 'recipient']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await governanceService.queryDraftTransactions(filter, options);
  res.send(result);
});

const executeDraftTransaction = catchAsync(async (req, res) => {
  await governanceService.validateExecutionOfDraftTransaction(req.params.draftTransactionId, req.body.tx);
  const transaction = await governanceService.executeDraftTransaction(req.params.draftTransactionId, req.user.address, req.body.tx);
  res.send(transaction);
});

const deleteDraftTransaction = catchAsync(async (req, res) => {
  await governanceService.deleteDraftTransaction(req.params.draftTransactionId);
  res.status(httpStatus.NO_CONTENT).send();
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
  createDraftTransaction,
  signDraftTransaction,
  getDraftTransactions,
  executeDraftTransaction,
  deleteDraftTransaction,
  getTransactions,
};
