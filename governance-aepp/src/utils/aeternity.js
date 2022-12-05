import {Node, Universal, MemoryAccount, RpcAepp} from '@aeternity/aepp-sdk/es';
import BrowserWindowMessageConnection from "@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message";
import Detector from "@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector";

import registryContractSource from '../assets/contracts/RegistryInterface.aes';
import settings from '../data/settings';
import { EventBus } from './eventBus';

const aeternity = {
  rpcClient: null,
  client: null,
  networkId: null,
  static: true,
};

const tempCallOptions = { gas: 100000000000 };
aeternity.tempCallOptions = tempCallOptions;

aeternity.initProvider = async (changedClient = false) => {
  try {
    const networkId = (await aeternity.client.getNodeInfo()).nodeNetworkId;
    const changedNetwork = aeternity.networkId !== networkId;
    aeternity.networkId = networkId
    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, { contractAddress: settings[aeternity.networkId].contractAddress });
    aeternity.client.api.protectedDryRunTxs = aeternity.client.api.dryRunTxs;

    if (changedClient || changedNetwork) {
      EventBus.$emit('networkChange');
      EventBus.$emit('dataChange');
    }
    return true;
  } catch (e) {
    console.error(e);
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
  /*
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
  */
  return Universal({
    compilerUrl: settings.compilerUrl,
    nodes: [
      {
        name: 'mainnet',
        instance: await Node({
          url: settings.ae_mainnet.nodeUrl,
        }),
      }],
  });
};

/**
 * Returns true if a client has been initialized.
 * Used to check after switching pages if the initialization was already done.
 * @returns {boolean}
 */
aeternity.hasActiveWallet = () => {
  return !!aeternity.client;
};

/**
 * Checks if the initialized client is connected to the ae-mainnet
 * @returns {boolean}
 */
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
      nodes: [{name: 'testnet', instance: await Node({url: settings.ae_uat.nodeUrl})}],
      compilerUrl: settings.compilerUrl,
      accounts: [
        MemoryAccount({keypair: {secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY}}),
      ],
    });
    aeternity.static = false;
    return aeternity.initProvider(true);
  }

  if (!aeternity.client) aeternity.client = await aeternity.initStaticClient();
  return aeternity.initProvider(true);
};

aeternity.disconnect = async () => {
  await aeternity.rpcClient.disconnectWallet();
  await aeternity.scanForWallets();
}

aeternity.getReverseWindow = () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://base.aepps.com/';
  //iframe.src = 'https://localhost:8080/';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  return iframe.contentWindow;
}

aeternity.scanForWallets = async (successCallback) => {
  const scannerConnection = await BrowserWindowMessageConnection({
    connectionInfo: { id: 'spy' },
  });
  const detector = await Detector({ connection: scannerConnection });
  const handleWallets = async function ({ _, newWallet }) {
    detector.stopScan();
    const connected = await aeternity.rpcClient.connectToWallet(await newWallet.getConnection());
    aeternity.rpcClient.selectNode(connected.networkId); // connected.networkId needs to be defined as node in RpcAepp
    await aeternity.rpcClient.subscribeAddress('subscribe', 'current');
    aeternity.client = aeternity.rpcClient;
    aeternity.static = false;
    await aeternity.initProvider(true);
    successCallback();
  };

  detector.scan(handleWallets);
}

aeternity.isIrisCompiler = () => {
  const compilerVersion = aeternity.client.compilerVersion && parseInt(aeternity.client.compilerVersion.substr(0, 1));
  return compilerVersion >= 5;
}

aeternity.initWalletSearch = async (successCallback) => {
  // Open iframe with Wallet if run in top window
  // window !== window.parent || await aeternity.getReverseWindow();

  aeternity.rpcClient = await RpcAepp({
    name: 'AEPP',
    nodes: [
      {name: 'ae_mainnet', instance: await Node({url: settings.ae_mainnet.nodeUrl})},
      {name: 'ae_uat', instance: await Node({url: settings.ae_uat.nodeUrl})}
    ],
    compilerUrl: settings.compilerUrl,
    onNetworkChange (params) {
      this.selectNode(params.networkId); // params.networkId needs to be defined as node in RpcAepp
      aeternity.initProvider();
    },
    onAddressChange(addresses) {
      if (!addresses.current[aeternity.address]) {
        EventBus.$emit('addressChange');
        EventBus.$emit('dataChange');
      }
    }
  });

  await aeternity.scanForWallets(successCallback);
}

// GOVERNANCE CUSTOM LOGIC

aeternity.delegation = async (address) => {
  return (await aeternity.contract.methods.delegatee(address)).decodedResult;
};

aeternity.delegations = async (address) => {
  const delegationsResult = await aeternity.contract.methods.delegators(address, tempCallOptions);
  return Promise.all(delegationsResult.decodedResult.map(async ([delegator, delegatee]) => {
    const delegateeDelegations = (await aeternity.contract.methods.delegators(delegator, tempCallOptions)).decodedResult;
    return {
      delegator: delegator,
      delegatee: delegatee,
      delegatorAmount: await aeternity.client.balance(delegator).catch(() => '0'),
      includesIndirectDelegations: delegateeDelegations.length !== 0,
    };
  }));
};

aeternity.polls = async () => {
  const polls = await aeternity.contract.methods.polls(tempCallOptions);
  return polls.decodedResult;
};

export default aeternity;
