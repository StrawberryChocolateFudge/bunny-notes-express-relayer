const { ethers } = require("ethers");
const fetch = require("node-fetch-commonjs");
const { groth16 } = require("snarkjs");
const bigInt = require("big-integer")

const CONTRACTADDRESS_USDTM_100 = "0x94D1f7e4667f2aE54494C2a99A18C8B4aED9B22A";

const CONTRACTADDRESS_BTT_1 = "0x2D524Ee2669b7F521B9d903A56002ba565cc50ba"

const CONTRACTADDRESS_FANTOM_TESTNET_1FTM = "0xeE55e7A619343B2f045bfD9A720BF912e1FCfEC7";

const BTTCTESTNETID = "0x405";

const FANTOMTESTNETID = "0xfa2";

const validNetworks = [BTTCTESTNETID, FANTOMTESTNETID];

const BTTCNETWORKRPCURL = "https://pre-rpc.bt.io/";

const FANTOMTESTNETRPCURL = "https://xapi.testnet.fantom.network/lachesis"

function getContractAddress(currency, denomination, network) {
    switch (network) {
        case BTTCTESTNETID:
            if (currency === "USDTM" && denomination === "100") {
                return CONTRACTADDRESS_USDTM_100
            } else if (currency === "BTT" && denomination === "1") {
                return CONTRACTADDRESS_BTT_1;
            }
        case FANTOMTESTNETID:
            if (currency === "FTM" && denomination === "1") {
                return CONTRACTADDRESS_FANTOM_TESTNET_1FTM;
            }
        default:
            return "";
    }
}

async function getArtifact() {
    const res = await fetch("https://bunnynotes.finance/ERC20Notes.json");
    return res.json();
}

async function getProvider(network) {
    switch (network) {
        case BTTCTESTNETID:
            return new ethers.providers.JsonRpcProvider(BTTCNETWORKRPCURL);
        case FANTOMTESTNETID:
            return new ethers.providers.JsonRpcProvider(FANTOMTESTNETRPCURL);
        default:
            break;
    }
}

async function getWallet(provider) {
    const key = process.env.SECRETKEY;
    return new ethers.Wallet(key, provider)
}

async function getContract(provider, wallet, abi, currency, denomination, network) {
    const address = getContractAddress(currency, denomination, network);
    const contract = new ethers.Contract(address, abi, provider);
    return contract.connect(wallet);
}

async function bunnyNotesWithdrawCashNote(contract, solidityProof, nullifierHash, commitment, recipient, change) {
    return await contract.withdrawCashNote(solidityProof, nullifierHash, commitment, recipient, change);
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

module.exports = { validNetworks, toNoteHex, verifyProof, packToSolidityProof, CONTRACTADDRESS_USDTM_100, CONTRACTADDRESS_BTT_1, CONTRACTADDRESS_FANTOM_TESTNET_1FTM, FANTOMTESTNETRPCURL, BTTCNETWORKRPCURL, getArtifact, getProvider, getWallet, getContract, bunnyNotesWithdrawCashNote, bunnyNotesCommitments, bunnyNoteIsSpent }

