let transactions = [];
let nextId = 1;

const getAllTransactions = (req, res) => {
  const userTxns = transactions.filter((t) => t.userId === req.user._id.toString());
  res.status(200).json({ count: userTxns.length, transactions: userTxns });
};

const getTransaction = (req, res) => {
  const txn = transactions.find((t) => t.id === parseInt(req.params.id));
  if (!txn) return res.status(404).json({ message: "Transaction not found." });
  res.status(200).json({ transaction: txn });
};

const createTransaction = (req, res) => {
  const { type, amount, description, referenceId } = req.body;
  if (!type || !amount) return res.status(400).json({ message: "Type and amount are required." });
  const txn = {
    id: nextId++,
    userId: req.user._id.toString(),
    type, amount, description, referenceId,
    createdAt: new Date().toISOString(),
  };
  transactions.push(txn);
  res.status(201).json({ message: "Transaction recorded.", transaction: txn });
};

const updateTransaction = (req, res) => {
  const idx = transactions.findIndex((t) => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "Transaction not found." });
  transactions[idx] = { ...transactions[idx], ...req.body };
  res.status(200).json({ message: "Transaction updated.", transaction: transactions[idx] });
};

const deleteTransaction = (req, res) => {
  const idx = transactions.findIndex((t) => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "Transaction not found." });
  transactions.splice(idx, 1);
  res.status(200).json({ message: "Transaction deleted." });
};

module.exports = { getAllTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
