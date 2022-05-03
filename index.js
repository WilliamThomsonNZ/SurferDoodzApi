// Add Express
const express = require("express");
const fs = require("fs");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const cors = require("cors");

const whtielistAddresses = fs
  .readFileSync("whitelist.csv")
  .toString()
  .split("\n")
  .map((e) => e.trim());
whtielistAddresses.pop();

function generateRoot() {
  const leaves = whtielistAddresses.map((addr) => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256);
  const root = tree.getRoot().toString("hex");
  return [root, tree];
}

function generateProof(_address) {
  const [root, tree] = generateRoot();
  const leaf = keccak256(_address);
  const proof = tree.getHexProof(leaf);
  return proof;
}

function onWhitelist(_address) {
  const found = whtielistAddresses.find((addr) => addr == _address);
  if (found) return true;
  return false;
}
// Initialize Express
const app = express();

//Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3000/*"],
  })
);

//endpoints
app.get("/api/merkleproof", (req, res) => {
  try {
    const addr = req.query.address;
    const proof = generateProof(addr);
    res.json({ code: 200, proof: proof });
  } catch (err) {
    console.log(err);
    res.json({ code: 400, message: err });
  }
});

app.get("/api/merkleroot", (req, res) => {
  try {
    const [root, tree] = generateRoot();
    res.json({ code: 200, root: root });
  } catch (err) {
    res.json({ code: 400, message: err.message });
  }
});

app.get("/api/whitelist", (req, res) => {
  try {
    const addr = req.query.address;
    const isOnWhitelist = onWhitelist(addr);
    if (isOnWhitelist) {
      res.json({ code: 200, onWhiteliist: true });
    } else {
      res.json({ code: 200, onWhiteliist: false });
    }
  } catch (err) {
    res.json({ code: 400, message: err.message });
  }
});

// Initialize server
app.listen(2000, () => {
  console.log("Running on port 2000.");
});

// Export the Express API
module.exports = app;
