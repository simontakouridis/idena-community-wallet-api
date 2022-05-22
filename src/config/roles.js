const allRoles = {
  user: [],
  admin: ['manageUsers', 'manageWallets', 'manageProposals', 'manageTransactions'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
