var express = require('express');
const { CONTRACTADDRESS_USDTM_100, RPCURL, getArtifact, getProvider, getWallet, getContract, bunnyNotesWithdrawCashNote, bunnyNotesCommitments, bunnyNoteIsSpent } = require("../web3/index");
const { readCommitment, writeCommitment, deleteCommitment } = require("../in-memory-kv/index");
var router = express.Router();


function validateBody(body) {
  if (!body.solidityProof) {
    return [false, "Missing Proof"];
  }
  if (!body.nullifierHash) {
    return [false, "Missing NullifierHash"];
  }
  if (!body.commitment) {
    return [false, "Missing Commitment"]
  }
  if (!body.recepient) {
    return [false, "Missing recepinet"];
  }
  if (!body.change) {
    return [false, "Missing Change"];
  }
  if (!body.denomination) {
    return [false, "Missing denomination"];
  }
  if (!body.currency) {
    return [false, "Missing Currency"]
  }
  if (!body.type) {
    return [false, "Missing Type"]
  }
  return [true, "Valid"];
}

async function handleWeb3(body) {
  const artifact = await getArtifact();

  const provider = await getProvider();

  const wallet = await getWallet(provider);

  const contract = await getContract(provider, wallet, artifact.abi, artifact.bytecode);

  const commitments = await bunnyNotesCommitments(contract, body.commitment);
  if (!commitments.used) {
    return [false, "Invalid Note! Missing Deposit!"]
  }

  const noteIsSpent = await bunnyNoteIsSpent(contract, body.nullifierHash);
  if (noteIsSpent) {
    return [false, "Note already spent!"]
  }

  // checking if the commitment is in the KV, this is to protect against spamming
  const kvCommitment = await readCommitment(body.commitment);
  if (kvCommitment !== undefined) {

    // If the date of the commitment is less than 10 min then it's an error, 
    // otherwise I delete the commitment and allow try again! 10 min is plenty of block time

    const timeNow = new Date().getTime();

    if ((timeNow - kvCommitment) < 600000) {
      return [false, "Transaction already dispatched!"]
    } else {
      deleteCommitment(body.commitment);
    }
  }
  try {
    if (body.type === "Gift Card") {
      await bunnyNotesWithdrawGiftCard(contract, body.solidityProof, body.nullifierHash, body.commitment, body.recepient, body.change);
    } else if (body.type === "Cash Note") {
      await bunnyNotesWithdrawCashNote(contract, body.solidityProof, body.nullifierHash, body.commitment, body.recepient, body.change);
    }
  } catch (err) {
    return [false, "Transaciton reverted!"]
  }
  // save the commitment in workers KV so I know the transaciton has been dispatched for it!
  await writeCommitment(body.commitment, new Date().getTime())

  return [true, "Transaction dispatched!"]
}


router.post('/', async function (req, res, next) {
  const body = req.body;

  const valid = validateBody(body);

  if (!valid) {
    // Return invalid request body
    res.status(500).json({ msg: "Invalid request!" })
  }
  const [success, msg] = await handleWeb3(body);
  if (!success) {
    res.status(500).json({ msg })
  }
  res.status(200).json({ msg })
});

module.exports = router;
