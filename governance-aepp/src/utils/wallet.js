import {
  AE_AMOUNT_FORMATS, AeSdk, AeSdkAepp, BrowserWindowMessageConnection, Node, walletDetector,
} from '@aeternity/aepp-sdk'

import settings from './settings';
import {reactive} from 'vue'

const nodes = [{
  name: 'ae_mainnet', instance: new Node('https://mainnet.aeternity.io'),
}, {
  name: 'ae_uat', instance: new Node('https://testnet.aeternity.io')
}]

export let sdk = null

export const wallet = reactive({
  activeWallet: null, address: null, balance: null, walletStatus: null, isStatic: false, networkId: null,
})

export const initWallet = async (eventBus) => {
  wallet.walletStatus = 'connecting'

  try {
    // try to connect to Superhero Wallet
    sdk = new AeSdkAepp({
      name: 'AEPP', nodes, compilerUrl: settings.compilerUrl, onNetworkChange: async (network) => {
        console.info('onNetworkChange:', network)
        await aeConnectToNode(network.networkId)
        if (eventBus) eventBus.emit('dataChange');
      }, onAddressChange: async (addresses) => {
        console.info('onAddressChange:', addresses)
        await aeConnectToNode(wallet.networkId)
        if (eventBus) eventBus.emit('dataChange');
      },
    })

    await scanForWallets()

    if (wallet.walletStatus === 'fallback_static') {
      wallet.isStatic = true;

      sdk = new AeSdk({
        compilerUrl: settings.compilerUrl, nodes,
      })

      await aeConnectToNode(settings.defaultNetworkId)
    }
  } catch (error) {
    console.error('initWallet error:', error)
    return false
  }

  return true
}

export const scanForWallets = async () => {
  wallet.walletStatus = 'scanning'

  const detectedWallet = await Promise.race([new Promise((resolve) => {
    const handleWallets = async () => {
      stopScan()
      resolve(true);
    }

    const scannerConnection = new BrowserWindowMessageConnection()
    const stopScan = walletDetector(scannerConnection, handleWallets)
  }), new Promise((resolve) => setTimeout(() => {
    resolve(false);
  }, 1000))]);

  console.log('scanForWallets detectedWallet:', detectedWallet)

  if (detectedWallet) {
    await new Promise((resolve) => {
      const handleWallets = async ({wallets, newWallet}) => {
        try {
          wallet.walletStatus = 'asking_permission'
          newWallet = newWallet || Object.values(wallets)[0]
          stopScan()

          wallet.activeWallet = newWallet

          const {networkId} = await sdk.connectToWallet(newWallet.getConnection())
          await sdk.subscribeAddress('subscribe', 'current')

          await aeConnectToNode(networkId);
          resolve()
        } catch (error) {
          console.error('scanForWallets error:', error)
          wallet.walletStatus = 'fallback_static'
        }
      }

      const scannerConnection = new BrowserWindowMessageConnection()
      const stopScan = walletDetector(scannerConnection, handleWallets)
    })
  } else {
    wallet.walletStatus = 'fallback_static'
  }
}

export const fetchWalletInfo = async () => {
  wallet.walletStatus = 'fetching_info'

  try {
    wallet.networkId = await sdk.getNetworkId()
    if (!wallet.isStatic) {
      wallet.address = await sdk.address()

      wallet.balance = await sdk.getBalance(wallet.address, {
        format: AE_AMOUNT_FORMATS.AE,
      })
    }
    wallet.walletStatus = 'connected'
  } catch (error) {
    console.error('fetchWalletInfo error:', error)
    return 'fetching failed'
  }
}

export const aeConnectToNode = async (selectedNetworkId) => {
  sdk.selectNode(selectedNetworkId)
  await fetchWalletInfo()
}

