export default {
  compilers:[
    { url: 'https://v400.compiler.aeternity.art', version: 'v4.0.0', pragma: 4 },
    { url: 'https://v410.compiler.aeternity.art', version: 'v4.1.0', pragma: 4 },
    { url: 'https://v420.compiler.aeternity.art', version: 'v4.2.0', pragma: 4 },
    { url: 'https://v421.compiler.aeternity.art', version: 'v4.2.1', pragma: 4 },
    { url: 'https://v430.compiler.aeternity.art', version: 'v4.3.0', pragma: 4 },
    { url: 'https://v500.compiler.aeternity.art', version: 'v5.0.0', pragma: 5 },
    { url: 'https://v600.compiler.aeternity.art', version: 'v6.0.0', pragma: 6 },
    { url: 'https://v601.compiler.aeternity.art', version: 'v6.0.1', pragma: 6 },
    { url: 'https://v602.compiler.aeternity.art', version: 'v6.0.2', pragma: 6 },
    { url: 'https://v610.compiler.aeternity.art', version: 'v6.1.0', pragma: 6 },
  ],

  ae_uat: {
    nodeUrl: 'https://testnet.aeternity.io',
    compilerUrl: 'https://compiler.aepps.com',
    middlewareUrl: 'https://testnet.aeternity.io/mdw/',
    contractAddress: 'ct_2nritSnqW6zooEL4g2SMW5pf12GUbrNyZ17osTLrap7wXiSSjf',
    backendUrl: 'https://testnet.server.governance.aeternity.art',
    // backendUrl: 'http://localhost:3002'
  },

  ae_mainnet: {
    nodeUrl: 'https://mainnet.aeternity.io',
    compilerUrl: 'https://compiler.aepps.com',
    middlewareUrl: 'https://mainnet.aeternity.io/mdw/',
    contractAddress: 'ct_ouZib4wT9cNwgRA1pxgA63XEUd8eQRrG8PcePDEYogBc1VYTq',
    backendUrl: 'https://server.governance.aeternity.art',
    // backendUrl: 'http://localhost:3001'
  }
};
