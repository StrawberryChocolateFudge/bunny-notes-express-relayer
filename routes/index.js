var express = require('express');
const { toNoteHex, verifyProof, getArtifact, getProvider, getWallet, getContract, bunnyNotesWithdrawCashNote, bunnyNotesCommitments, bunnyNoteIsSpent, packToSolidityProof } = require("../web3/index");
const { readCommitment, writeCommitment, deleteCommitment } = require("../in-memory-kv/index");
const { verificationKey } = require("../web3/verificationKey");
var router = express.Router();


function validateBody(body) {
  if (!body.proof) {
    return [false, "Missing Proof"];
  }
  if (!body.publicSignals) {
    return [false, "Missing public signals!"]
  }
  if (!body.recepient) {
    return [false, "Missing recepinet"];
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

  const nullifierHash = toNoteHex(body.publicSignals[0]);
  const commitment = toNoteHex(body.publicSignals[1]);
  const change = body.publicSignals[3];
  try {
    const proofValid = await verifyProof(verificationKey, { proof: body.proof, publicSignals: [nullifierHash, commitment, body.recepient, change] })
    if (!proofValid) {
      return [false, "Invalid Proof!"]
    }
  } catch (err) {
    return [false, "Invalid Proof!"];
  }
  const artifact = await getArtifact();

  const provider = await getProvider();

  const wallet = await getWallet(provider);

  const contract = await getContract(provider, wallet, artifact.abi, artifact.bytecode);

  const commitments = await bunnyNotesCommitments(contract, commitment);
  if (!commitments.used) {
    return [false, "Invalid Note! Missing Deposit!"]
  }

  const noteIsSpent = await bunnyNoteIsSpent(contract,
    nullifierHash);
  if (noteIsSpent) {
    return [false, "Note already spent!"]
  }

  // checking if the commitment is in the KV, this is to protect against spamming
  const kvCommitment = await readCommitment(body.commitment);
  if (kvCommitment !== undefined) {

    // If the date of the commitment is less than 10 min then it's an error, 
    // otherwise I delete the commitment and allow try again! 10 min is plenty of block time (this is an edge case)

    const timeNow = new Date().getTime();

    if ((timeNow - kvCommitment) < 600000) {
      return [false, "Transaction already dispatched! If it returned an error, you need to wait 10 minutes try again!"]
    } else {
      deleteCommitment(body.commitment);
    }
  }


  const solidityProof = packToSolidityProof(body.proof)

  // save the commitment to memory so I know the transaciton has been dispatched for it!
  await writeCommitment(body.commitment, new Date().getTime())

  try {
    if (body.type === "Gift Card") {
      await bunnyNotesWithdrawGiftCard(contract, solidityProof, nullifierHash, commitment, body.recepient, change);
    } else if (body.type === "Cash Note") {
      await bunnyNotesWithdrawCashNote(contract, solidityProof, nullifierHash, commitment, body.recepient, change);
    }
  } catch (err) {
    return [false, "Transaciton reverted!"]
  }

  return [true, "Transaction dispatched!"]
}


router.post('/', async function (req, res, next) {
  const body = req.body;
  const valid = validateBody(body);

  if (!valid) {
    // Return invalid request body
    return res.status(500).json({ msg: "Invalid request!" })
  }
  const [success, msg] = await handleWeb3(body);
  if (!success) {
    return res.status(500).json({ msg })
  }
  return res.status(200).json({ msg })
});

router.get("/", async function (req, res, next) {
  return res.status(200).send("Relayer is online");
})


module.exports = router;
