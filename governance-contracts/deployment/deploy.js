/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
const Deployer = require('forgae-lib').Deployer;
const Universal = require('@aeternity/aepp-sdk').Universal;

const deploy = async (network, privateKey, compiler) => {
    let deployer = new Deployer(network, privateKey, compiler)

    const client = await Universal({
        url: deployer.network.url,
        internalUrl: deployer.network.url,
        keypair: deployer.keypair,
        networkId: deployer.network.networkId,
        compilerUrl: deployer.compilerUrl
    });

    /*
    await client.spend(100000000000000000000, "ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag");
    await client.spend(50000000000000000000, "ak_9jFvDQKvq6Viap476momQDjbPxf17pDgKuMv6dseryxdpaZUF");
    await client.spend(20000000000000000000, "ak_2wV4puWGcrV8rLxrRaPrFuMrgkUG413UvmgNeVdyqxKmUMSkEk");
    await client.spend(10000000000000000000, "ak_xFowwp6E9t2mbHpjb2a8dGCMHSr7f3LxHAtW65qxrti3nDKKk");
    await client.spend(1000000000000000000, "ak_11111111111111111111111111111111273Yts");*/

    await deployer.deploy("./contracts/Registry.aes")
};

module.exports = {
    deploy
};
