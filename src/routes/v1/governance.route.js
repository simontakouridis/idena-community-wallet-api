const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  authorOfDraftWalletOnly,
  adminOfWalletOnly,
  adminOfProposalWalletOnly,
  adminOfCurrentWalletOnly,
  adminOfCurrentWalletOrSoleAdminOnly,
} = require('../../middlewares/governance');
const governanceValidation = require('../../validations/governance.validation');
const governanceController = require('../../controllers/governance.controller');
const { lowercaseAddress } = require('../../middlewares/general');

const router = express.Router();

router.post(
  '/create-draft-wallet',
  auth('manageWallets'),
  adminOfCurrentWalletOrSoleAdminOnly,
  validate(governanceValidation.createDraftWallet),
  lowercaseAddress,
  governanceController.createDraftWallet
);
router.post(
  '/add-signer',
  auth('manageWallets'),
  adminOfCurrentWalletOrSoleAdminOnly,
  validate(governanceValidation.addSigner),
  lowercaseAddress,
  governanceController.addSigner
);
router.get('/draft-wallets', validate(governanceValidation.getDraftWallets), lowercaseAddress, governanceController.getDraftWallets);

router
  .route('/draft-wallets/:draftWalletId')
  .patch(auth('manageWallets'), authorOfDraftWalletOnly, validate(governanceValidation.activateDraftWallet), governanceController.activateDraftWallet)
  .delete(auth('manageWallets'), authorOfDraftWalletOnly, validate(governanceValidation.deleteDraftWallet), governanceController.deleteDraftWallet);

router.get('/wallets', validate(governanceValidation.getWallets), lowercaseAddress, governanceController.getWallets);

router.post(
  '/create-proposal',
  auth('manageProposals'),
  adminOfCurrentWalletOnly,
  validate(governanceValidation.createProposal),
  lowercaseAddress,
  governanceController.createProposal
);

router.get('/proposals', validate(governanceValidation.getProposals), lowercaseAddress, governanceController.getProposals);

router
  .route('/proposals/:proposalId')
  .put(auth('manageProposals'), adminOfProposalWalletOnly, validate(governanceValidation.editProposal), governanceController.editProposal)
  .delete(auth('manageProposals'), adminOfProposalWalletOnly, validate(governanceValidation.deleteProposal), governanceController.deleteProposal);

router.post(
  '/create-transaction',
  auth('manageTransactions'),
  adminOfWalletOnly,
  validate(governanceValidation.createTransaction),
  lowercaseAddress,
  governanceController.createTransaction
);
router.get('/transactions', validate(governanceValidation.getTransactions), lowercaseAddress, governanceController.getTransactions);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Governance
 *   description: Community Wallet Governance management and retrieval
 */

/**
 * @swagger
 * /governance/create-draft-wallet:
 *   post:
 *     summary: Create Draft Wallet
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
 *             properties:
 *               address:
 *                 type: string
 *             example:
 *               address: '0xebb1bc133f0db6869c8ba67d0ce94ea86be83bc1'
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/DraftWallet'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/add-signer:
 *   post:
 *     summary: Add signer to draft wallet
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
 *               - signer
 *               - contract
 *             properties:
 *               signer:
 *                 type: string
 *               contract:
 *                 type: string
 *             example:
 *               signer: '0x21bcedf993e0ae914e42498e0c7e0be5f9fac83d'
 *               contract: '0x7013a7e43c610ab7f4b61f67cb1830252f9b38eb'
 *     responses:
 *       "200":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/DraftWallet'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /governance/draft-wallets:
 *   get:
 *     summary: Get all draft wallets
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: Draft wallet address
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Draft wallet author
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
 *                     $ref: '#/components/schemas/DraftWallet'
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
 * /draft-wallets/{draftWalletId}:
 *   patch:
 *     summary: activate a draft wallet
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftWalletId
 *         required: true
 *         schema:
 *           type: string
 *         description: Draft Wallet Id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Wallet'
 *       "400":
 *         $ref: '#/components/responses/DuplicateAddress'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a draft wallet
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftWalletId
 *         required: true
 *         schema:
 *           type: string
 *         description: Draft Wallet Id
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /governance/wallets:
 *   get:
 *     summary: Get all wallets
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: Wallet address
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Wallet author
 *       - in: query
 *         name: round
 *         schema:
 *           type: string
 *         description: Wallet round
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
 *             example:
 *               title: 'Title of Proposal'
 *               description: 'Description of Proposal'
 *               oracle: '0xebb1bc133f0db6869c8ba67d0ce94ea86be83bc1'
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
 *         name: acceptanceStatus
 *         schema:
 *           type: string
 *         description: Proposal acceptance status
 *       - in: query
 *         name: fundingStatus
 *         schema:
 *           type: string
 *         description: Proposal funding status
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
 * /proposals/{proposalId}:
 *   put:
 *     summary: edit proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal Id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               oracle:
 *                 type: string
 *               acceptanceStatus:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *               fundingStatus:
 *                 type: string
 *                 enum: [pending, funded, unfunded]
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               title: 'Title of Proposal'
 *               description: 'Description of Proposal'
 *               oracle: '0xebb1bc133f0db6869c8ba67d0ce94ea86be83bc1'
 *               acceptanceStatus: 'pending'
 *               fundingStatus: 'pending'
 *               transactions: ['6290297498583516260e5de1', '6290297498583516260e5de2']
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Proposal'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ProposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal Id
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
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
