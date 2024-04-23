const fs = require('fs');
const blake2b = require('blake2b')
const path = require("path");
const crypto = require("crypto");
const fetch = require('node-fetch');

const contractsPath = './contracts'
const contracts = fs.readdirSync(contractsPath)

const generateSourceHashes = () => {
    const hashes = contracts.reduce((acc, contract) => {
        const source = fs.readFileSync(path.join(contractsPath, contract), 'utf-8')
        acc[contract] = Buffer.from(blake2b(32).update(Buffer.from(source)).digest('hex'), 'hex').toString('base64')
        return acc;
    }, {});

    fs.writeFileSync('./generated/source_hashes.json', JSON.stringify(hashes, null, 2))
};

const generateCompilersDockerCompose = async () => {
    const compilerTagsData = await fetch('https://hub.docker.com/v2/repositories/aeternity/aesophia_http/tags/?page_size=1000').then(res => res.json())
    const compilerTags = compilerTagsData.results.reduce((acc, tagData) => {
        if (tagData.name.startsWith('v')) acc.push(tagData.name)
        return acc;
    }, []);

    const compilers = compilerTags.reduce(({compose, versions}, tag, i) => {
        const name = 'aesophia_' + tag.replaceAll('.', '-');
        const port = 3081 + i;
        compose += `
    ${name}:
        image: aeternity/aesophia_http:${tag}
        ports:
          - "${port}:3080"
            `
        versions.push({tag, port});
        return {compose, versions};
    }, {
        compose:
            `
version: '3.6'
services:
`,
        versions: []
    })

    fs.writeFileSync('./docker-compose.compilers.yml', compilers.compose);
    // TODO needs execution twice currently, once before `docker-compose -f docker-compose.compilers.yml up` and one after, too lazy to fix
    return compilers.versions;
};

const compileContracts = async (compilerVersions) => {
    const hashes = await compilerVersions.filter(compilerVersion => compilerVersion.port < 3091).reduce(async (compilerAccPromise, compilerVersion) => {
        const compilerAcc = await compilerAccPromise;
        const compiler = await fetch('http://localhost:' + compilerVersion.port + '/version').then(res => res.json());
        console.log(compiler.version)

        compilerAcc[compiler.version] = await contracts.reduce(async (accPromise, contract) => {
            const acc = await accPromise;

            const source = fs.readFileSync(path.join(contractsPath, contract), 'utf-8')

            try {
                const compiled = await fetch('http://localhost:' + compilerVersion.port + '/compile', {
                    method: 'POST',
                    body: JSON.stringify({code: source, options: {}}),
                    headers: {'Content-Type': 'application/json'}
                }).then(res => res.json());


                if (!compiled.bytecode && Array.isArray(compiled)) console.log(contract, compiler.version, compiled.map(e => e.message).join("; "));
                acc[contract] = compiled.bytecode
                    ? {hash: crypto.createHash('sha256').update(compiled.bytecode).digest('hex'), bytecode: compiled.bytecode}
                    : null
            } catch (e) {
                acc[contract] = {error: e.message};
            }
            return acc;
        }, Promise.resolve({}));

        return compilerAcc;
    }, Promise.resolve({}))

    fs.writeFileSync('./generated/bytecode_hashes.json', JSON.stringify(hashes, null, 2))
}

generateSourceHashes();
void generateCompilersDockerCompose().then(compileContracts);

