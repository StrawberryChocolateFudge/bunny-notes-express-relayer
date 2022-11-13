const { ethers } = require("ethers");
const fetch = require("node-fetch-commonjs");
const { groth16 } = require("snarkjs");
const bigInt = require("big-integer")

const CONTRACTADDRESS_USDTM_100 = "0xa756b2b52Ba893a6109561bC86138Cbb897Fb2e0";
const RPCURL = "https://pre-rpc.bt.io/";

async function getArtifact() {
    const res = await fetch("https://bunnynotes.finance/ERC20Notes.json");
    return res.json();
}

async function getProvider() {
    return new ethers.providers.JsonRpcProvider(RPCURL)
}

async function getWallet(provider) {
    const key = process.env.SECRETKEY;
    return new ethers.Wallet(key, provider)
}

async function getContract(provider, wallet, abi, bytecode) {
    const contract = new ethers.Contract(CONTRACTADDRESS_USDTM_100, abi, provider);
    return contract.connect(wallet);
}

async function bunnyNotesWithdrawCashNote(contract, solidityProof, nullifierHash, commitment, recepient, change) {
    return await contract.withdrawCashNote(solidityProof, nullifierHash, commitment, recepient, change);
}

async function bunnyNotesCommitments(contract, commitment) {
    return await contract.commitments(commitment);
}

async function bunnyNoteIsSpent(contract, nullifierHash) {
    return await contract.isSpent(nullifierHash);
}

/** BigNumber to hex string of specified length */
function toNoteHex(number, length = 32) {
    const str = number instanceof Buffer ? number.toString('hex') : bigInt(number).toString(16)
    return '0x' + str.padStart(length * 2, '0')
}


/**
 * Makes a proof compatible with the Verifier.sol method inputs.
 * @param proof The proof generated with SnarkJS.
 * @returns The Solidity compatible proof.
 */
function packToSolidityProof(proof) {
    return [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1]
    ]
}

/**
 * Verifies a SnarkJS proof.
 * @param verificationKey The zero-knowledge verification key.
 * @returns True if the proof is valid, false otherwise.
 */
function verifyProof(verificationKey, { proof, publicSignals }) {
    return groth16.verify(
        verificationKey,
        [
            publicSignals[0],
            publicSignals[1],
            publicSignals[2],
            publicSignals[3]
        ],
        proof
    )
}

module.exports = { toNoteHex, verifyProof, packToSolidityProof, CONTRACTADDRESS_USDTM_100, RPCURL, getArtifact, getProvider, getWallet, getContract, bunnyNotesWithdrawCashNote, bunnyNotesCommitments, bunnyNoteIsSpent }

