import Aepp from '@aeternity/aepp-sdk/es/ae/aepp';
import Util from './util';
import registryContractSource from '../assets/contracts/RegistryInterface.aes';
import {Universal} from "@aeternity/aepp-sdk/es/ae/universal";
import Node from "@aeternity/aepp-sdk/es/node";
import settings from '../data/settings';
import pollContractSource from '../assets/contracts/Poll.aes';

const TESTNET_URL = 'https://testnet.aeternity.io';
const MAINNET_URL = 'https://mainnet.aeternity.io';
const COMPILER_URL = 'https://compiler.aepps.com';

const aeternity = {
  client: null,
  address: null,
  height: null,
  networkId: null,
  passive: false
};

const timeout = async (promise) => {
  return Promise.race([
    promise,
    new Promise(resolve =>
      setTimeout(() => {
        resolve('TIMEOUT');
      }, 30000))
  ]);
};

aeternity.initProvider = async () => {
  try {
    try {
      aeternity.address = await aeternity.client.address();
      aeternity.balance = await aeternity.client.balance(aeternity.address)
        .then(balance => `${Util.atomsToAe(balance)}`.replace(',', ''))
        .catch(() => '0');
    } catch (e) {
      aeternity.passive = true;
    }

    aeternity.height = await aeternity.client.height();
    aeternity.networkId = (await aeternity.client.getNodeInfo()).nodeNetworkId;
    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, {contractAddress: settings[aeternity.networkId].contractAddress});
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

aeternity.getWalletWindow = async () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://base.aepps.com/'; //https://stage-identity.aepps.com/ http://localhost:8080/
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  await new Promise(resolve => {
    const handler = ({data}) => {
      if (data.method !== 'ready') return;
      window.removeEventListener('message', handler);
      resolve();
    };
    window.addEventListener('message', handler);
  });
  return iframe.contentWindow;
};

aeternity.initReverseIframe = async () => {
  try {
    return await timeout(Aepp({
      parent: await aeternity.getWalletWindow()
    }));
  } catch (e) {
    console.warn('Reverse iFrame init failed');
    return false;
  }
};

/**
 * Initialize a static client, mainnet or testnet
 * This client can not sign transactions that require funds (everything except static contract calls)
 * @returns {Promise<*>}
 */
aeternity.initStaticClient = async () => {
  aeternity.static = true;

  // TESTNET
  return Universal({
    compilerUrl: COMPILER_URL,
    nodes: [
      {
        name: 'testnet',
        instance: await Node({
          url: TESTNET_URL,
        }),
      }],
  });
  // MAINNET
  /*
  return Universal({
    compilerUrl: COMPILER_URL,
    nodes: [
      {
        name: 'mainnet',
        instance: await Node({
          url: MAINNET_URL,
        }),
      }],
  });
  */
};

aeternity.verifyPollContract = async (pollAddress) => {
  const contractCreateBytecode = fetch(`${settings[aeternity.networkId].middlewareUrl}/middleware/contracts/transactions/address/${pollAddress}?limit=1&page=1`).then(async res => {
    const contractCreateTx = (await res.json()).transactions.filter(tx => tx.tx.type === 'ContractCreateTx')[0];
    return contractCreateTx ? contractCreateTx.tx.code : null;
  });

  const compilersResult = await Promise.all(settings.compilers.map(async compiler => {
    const compilerBytecode = await fetch(`${compiler.url}/compile`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        code: pollContractSource,
        options: {'backend': 'fate'}
      })
    }).then(async res => (await res.json()).bytecode);

    return {
      bytecode: compilerBytecode,
      matches: compilerBytecode === (await contractCreateBytecode),
      version: compiler.version
    }
  }));

  return compilersResult.find(test => test.matches);
};

aeternity.hasActiveWallet = () => {
  return !!aeternity.client && !!aeternity.contract;
};

aeternity.isMainnet = () => {
  return aeternity.networkId === 'ae_mainnet';
};

/**
 * Initializes the aeternity sdk to be imported in other occasions
 * @returns {Promise<boolean>}
 */
aeternity.initClient = async () => {
  if (process && process.env && process.env.PRIVATE_KEY && process.env.PUBLIC_KEY) {
    aeternity.client = await Universal({
      nodes: [{name: 'testnet', instance: await Node({url: TESTNET_URL})}],
      compilerUrl: COMPILER_URL,
      accounts: [
        MemoryAccount({keypair: {secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY}}),
      ],
    });
    return aeternity.initProvider();
  }

  if (!aeternity.client) aeternity.client = await aeternity.initStaticClient();
  return aeternity.initProvider();
};

aeternity.delegation = async (address) => {
  return (await aeternity.contract.methods.delegatee(address)).decodedResult;
};

aeternity.delegations = async (address) => {
  const delegationsResult = await aeternity.contract.methods.delegators(address);
  return Promise.all(delegationsResult.decodedResult.map(async ([delegator, delegatee]) => {
    const delegateeDelegations = (await aeternity.contract.methods.delegators(delegator)).decodedResult;
    return {
      delegator: delegator,
      delegatee: delegatee,
      delegatorAmount: await aeternity.client.balance(delegator).catch(() => '0'),
      includesIndirectDelegations: delegateeDelegations.length !== 0
    };
  }));
};

aeternity.polls = async () => {
  const polls = await aeternity.contract.methods.polls();
  return polls.decodedResult;
};

export default aeternity;
