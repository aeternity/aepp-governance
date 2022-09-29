const fs = require('fs');
const blake2b = require('blake2b')
const path = require("path");

const contractsPath = './contracts'
const contracts = fs.readdirSync(contractsPath)
const hashes = contracts.reduce((acc, contract) => {
    const source = fs.readFileSync(path.join(contractsPath, contract), 'utf-8')
    acc[contract] = Buffer.from(blake2b(32).update(Buffer.from(source)).digest('hex'), 'hex').toString('base64')
    return acc;
}, {});

fs.writeFileSync('./generated/source_hashes.json', JSON.stringify(hashes, null, 2))
