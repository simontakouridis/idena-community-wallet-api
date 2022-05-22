const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { adminOfWalletOnly, adminOfCurrentWalletOnly, adminOfCurrentWalletOrSoleAdminOnly } = require('../../middlewares/governance');
const governanceValidation = require('../../validations/governance.validation');
const governanceController = require('../../controllers/governance.controller');

const router = express.Router();

router.post(
  'create-wallet',
  auth('manageWallets'),
  adminOfCurrentWalletOrSoleAdminOnly,
  validate(governanceValidation.createWallet),
  governanceController.createWallet
);
router.get('wallets', validate(governanceValidation.getWallets), governanceController.getWallets);

router.post(
  'create-proposal',
  auth('manageProposals'),
  adminOfCurrentWalletOnly,
  validate(governanceValidation.createProposal),
  governanceController.createProposal
);
router.get('proposals', validate(governanceValidation.getProposals), governanceController.getProposals);

router.post(
  'create-transaction',
  auth('manageTransactions'),
  adminOfWalletOnly,
  validate(governanceValidation.createTransaction),
  governanceController.createTransaction
);
router.get('transactions', validate(governanceValidation.getTransactions), governanceController.getTransactions);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Governance
 *   description: Community Wallet Governance management and retrieval
 */

/**
 * @swagger
 * /governance/create-wallet:
 *   post:
 *     summary: Create Wallet
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - signatories
 *             properties:
 *               address:
 *                 type: string
 *               signatories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 5
 *                 maxItems: 5
 *             example:
 *               address: '0xebb1bc133f0db6869c8ba67d0ce94ea86be83bc1'
 *               signatories:
 *                 [
 *                   '0x883858f4afe0a15339a637109757213bb423d23d',
 *                   '0x589a74e1c833bb8936e9c7086898b50862515b3e',
 *                   '0x6f1abf821d05d8ef53fd877e9bbdda7adc1c97fa',
 *                   '0x2a1d875532189fb82c4c2b08cd46e9555dda3d8a',
 *                   '0x31e07c6dc4910381379adcddffaae6497e22dd5c',
 *                 ]
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Wallet'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/wallets:
 *   get:
 *     summary: Get all wallets
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: round
 *         schema:
 *           type: string
 *         description: Wallet round
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: Wallet address
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of wallets
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wallet'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/create-proposal:
 *   post:
 *     summary: Create Proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               oracle:
 *                 type: string
 *               wallet:
 *                 type: string
 *               accepted:
 *                 type: string
 *                 enum: [pending, yes, no]
 *               status:
 *                 type: string
 *                 enum: [pending, funded, unfunded]
 *               transaction:
 *                 type: string
 *             example:
 *               title: 'Title of Proposal'
 *               description: 'Description of Proposal'
 *               oracle: '0xebb1bc133f0db6869c8ba67d0ce94ea86be83bc1'
 *               wallet: 62807ce6e069cd00272fa3af
 *               accepted: pending
 *               status: pending
 *               transaction: 62807d2ce069cd00272fa3c0
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Proposal'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/proposals:
 *   get:
 *     summary: Get all proposals
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Proposal title
 *       - in: query
 *         name: oracle
 *         schema:
 *           type: string
 *         description: Proposal oracle
 *       - in: query
 *         name: wallet
 *         schema:
 *           type: string
 *         description: Proposal wallet
 *       - in: query
 *         name: accepted
 *         schema:
 *           type: string
 *         description: Proposal accepted
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Proposal status
 *       - in: query
 *         name: transaction
 *         schema:
 *           type: string
 *         description: Proposal transaction
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of wallets
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/create-transaction:
 *   post:
 *     summary: Create Transaction
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - wallet
 *               - recipient
 *               - amount
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [fundProposal, transferToNewWallet, payForOracle]
 *               proposal:
 *                 type: string
 *               newWallet:
 *                 type: string
 *               wallet:
 *                 type: string
 *               recipient:
 *                 type: string
 *               amount:
 *                 type: number
 *             example:
 *               title: 'Title of Transaction'
 *               category: fundProposal
 *               proposal: 6280c41cfcc0830027b2d659
 *               newWallet: 62807ce6e069cd00272fa3432
 *               wallet: 62807ce6e069cd00272fa3af
 *               recipient: '0x9c380e8c30dc19dE008d4EFc09b7463803414639'
 *               amount: 1
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Transaction'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Transaction title
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Transaction category
 *       - in: query
 *         name: proposal
 *         schema:
 *           type: string
 *         description: Transaction proposal
 *       - in: query
 *         name: newWallet
 *         schema:
 *           type: string
 *         description: Transaction newWallet
 *       - in: query
 *         name: wallet
 *         schema:
 *           type: string
 *         description: Transaction wallet
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: Transaction recipient
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of wallets
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
