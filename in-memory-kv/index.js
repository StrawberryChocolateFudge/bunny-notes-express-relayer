
// A little in memory kv store to protect from spam requests!
// This is used like a mutex for requests. 
// after the tx is sent, the commitment is saved, 
// when another request comes the commitment is checked!
// The value is a time and if it's older than 10 minutes it will be deleted.
// That is plenty of time to mine blocks and allow a retry in 10 min if something goes wrong (should never occur)
const map = new Map();

function readCommitment(commitment) {
    return map.get(commitment);
}

function writeCommitment(commitment, contractaddr) {
    return map.set(commitment, contractaddr);
}

function deleteCommitment(commitment) {
    return map.delete(commitment);
}

module.exports = { readCommitment, writeCommitment,deleteCommitment }