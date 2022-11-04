
// A little in memory kv store to protect from spam requests!

const map = new Map();

function readCommitment(commitment) {
    return map.get(commitment);
}

function writeCommitment(commitment, contractaddr) {
    return map.set(commitment, contractaddr);
}


module.exports = { readCommitment, writeCommitment }