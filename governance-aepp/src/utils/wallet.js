import {
  AE_AMOUNT_FORMATS, AeSdk, AeSdkAepp, BrowserWindowMessageConnection, Node, walletDetector,
} from '@aeternity/aepp-sdk'

import settings from './settings';
import {reactive, toRefs} from 'vue'

const nodes = [{
  name: 'ae_uat', instance: new Node('https://testnet.aeternity.io')
}, {
  name: 'ae_mainnet', instance: new Node('https://mainnet.aeternity.io'),
}]

export let sdk = null

export const wallet = reactive({
  activeWallet: null, address: null, balance: null, walletStatus: null, isStatic: false, networkId: null,
})

export const initWallet = async () => {
  const {walletStatus, isStatic, networkId} = toRefs(wallet)

  walletStatus.value = 'connecting'

  try {
    // try to connect to Superhero Wallet
    sdk = new AeSdkAepp({
      name: 'AEPP', nodes, compilerUrl: settings.compilerUrl, onNetworkChange: async (network) => {
        console.info('onNetworkChange:', network)
        await aeConnectToNode(network.networkId)
      }, onAddressChange: async (addresses) => {
        console.info('onAddressChange:', addresses)
        await aeConnectToNode(networkId.value)
      },
    })

    await scanForWallets()

    if (walletStatus.value === 'fallback_static') {
      isStatic.value = true;

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
  const {walletStatus, activeWallet} = toRefs(wallet)

  walletStatus.value = 'scanning'

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
          walletStatus.value = 'asking_permission'
          newWallet = newWallet || Object.values(wallets)[0]
          stopScan()

          activeWallet.value = newWallet

          const {networkId} = await sdk.connectToWallet(newWallet.getConnection())
          await sdk.subscribeAddress('subscribe', 'current')

          await aeConnectToNode(networkId);
          resolve()
        } catch (error) {
          console.error('scanForWallets error:', error)
          walletStatus.value = 'fallback_static'
        }
      }

      const scannerConnection = new BrowserWindowMessageConnection()
      const stopScan = walletDetector(scannerConnection, handleWallets)
    })
  } else {
    walletStatus.value = 'fallback_static'
  }
}

export const fetchWalletInfo = async () => {
  const {address, balance, walletStatus, isStatic, networkId} = toRefs(wallet)

  walletStatus.value = 'fetching_info'

  try {
    networkId.value = await sdk.getNetworkId()
    if (!isStatic.value) {
      address.value = await sdk.address()

      balance.value = await sdk.getBalance(address.value, {
        format: AE_AMOUNT_FORMATS.AE,
      })
    }
    walletStatus.value = 'connected'
  } catch (error) {
    console.error('fetchWalletInfo error:', error)
    return 'fetching failed'
  }
}

export const aeConnectToNode = async (selectedNetworkId) => {
  sdk.selectNode(selectedNetworkId)
  await fetchWalletInfo()
}

