const lowercaseAddress = (req, res, next) => {
  /**
   * Body transformations
   */
  if (req.body.address) {
    req.body.address = req.body.address.toLowerCase();
  }
  if (req.body.author) {
    req.body.author = req.body.author.toLowerCase();
  }
  if (req.body.oracle) {
    req.body.oracle = req.body.oracle.toLowerCase();
  }
  if (req.body.recipient) {
    req.body.recipient = req.body.recipient.toLowerCase();
  }
  if (req.body.signer) {
    req.body.signer = req.body.signer.toLowerCase();
  }
  if (req.body.contract) {
    req.body.contract = req.body.contract.toLowerCase();
  }
  if (req.body.tx) {
    req.body.tx = req.body.tx.toLowerCase();
  }
  /**
   * Params transformations
   */
  if (req.params.address) {
    req.params.address = req.params.address.toLowerCase();
  }
  if (req.params.author) {
    req.params.author = req.params.author.toLowerCase();
  }
  if (req.params.oracle) {
    req.params.oracle = req.params.oracle.toLowerCase();
  }
  if (req.params.recipient) {
    req.params.recipient = req.params.recipient.toLowerCase();
  }
  if (req.params.signer) {
    req.params.signer = req.params.signer.toLowerCase();
  }
  if (req.params.contract) {
    req.params.contract = req.params.contract.toLowerCase();
  }
  if (req.params.tx) {
    req.params.tx = req.params.tx.toLowerCase();
  }
  next();
};

module.exports = {
  lowercaseAddress,
};
