const { ethers } = require("ethers");
const fetch = require("node-fetch-commonjs")

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

module.exports = { CONTRACTADDRESS_USDTM_100, RPCURL, getArtifact, getProvider, getWallet, getContract, bunnyNotesWithdrawCashNote, bunnyNotesCommitments, bunnyNoteIsSpent }
