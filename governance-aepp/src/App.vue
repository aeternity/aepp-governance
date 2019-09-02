<template>
  <div id="app" class="min-h-screen">
    <div class="content min-h-screen max-w-desktop">
      <div class="min-h-screen wrapper">
        <router-view v-if="clientAvailable"></router-view>
        <div class="inset-0 flex justify-center flex-col items-center" v-else>
          <BiggerLoader></BiggerLoader>
          <h2 class="mt-2 font-bold">Looking for a wallet. Check for popups.</h2>
          <ae-button v-show="showSkip" class="mt-4" face="round" fill="neutral" @click="abortWalletCheck">Continue without wallet</ae-button>
        </div>
        <div class="mb-24">
          <!-- BOTTOM SPACER -->
        </div>
      </div>
    </div>
    <CriticalErrorOverlay
      :error="error"
      @continue="errorClick"
      :errorCTA="errorCTA"
    ></CriticalErrorOverlay>
  </div>
</template>

<script>

  import {AeMain, AeButton} from '@aeternity/aepp-components/src/components'
  import CriticalErrorOverlay from '~/components/CriticalErrorOverlay'
  import aeternity from '~/utils/aeternity.js'
  import BiggerLoader from './components/BiggerLoader'

  export default {
    name: 'app',
    components: {BiggerLoader, CriticalErrorOverlay, AeMain, AeButton},
    data() {
      return {
        error: null,
        errorCTA: null,
        clientAvailable: false,
        ignoreErrors: (window.location.host.includes('localhost') || window.location.host.includes('0.0.0.0')),
        errorClick: () => {
        },
        showSkip: false
      }
    },
    methods: {
      async checkAndReloadProvider() {
        if (!aeternity.address) return;

        const changesDetected = await aeternity.verifyAddress();
        if (changesDetected) this.$router.go();
      },
      async abortWalletCheck() {
        await aeternity.disableWallet();
        this.clientAvailable = true;
      }
    },
    async created() {

      setTimeout(() => {this.showSkip = true}, 4000);

      // Bypass check if there is already an active wallet
      try {
        if (aeternity.hasActiveWallet()) {
          return this.clientAvailable = true
        } else if (aeternity.client && !aeternity.contract) {
          await aeternity.initProvider();
          return this.clientAvailable = true
        }

        if (!(await aeternity.initClient())) throw new Error('Wallet init failed');

        this.clientAvailable = true;

        // Constantly check if wallet is changed
        setInterval(this.checkAndReloadProvider, 1000)
      } catch (e) {
        console.error('Initializing Wallet Error', e);
        this.error = 'Could not connect to your wallet. Please make sure you grant this application access to your wallet. Also make sure the choosen Account has funds available.';
        this.errorCTA = 'Retry';
        this.errorClick = () => {
          window.location.reload()
        }
      }
    }
  }
</script>

<style scoped>
  .min-h-screen {
    min-height: 100vh;
    max-height: 100vh;
    padding-bottom: 0;
    overflow-y: auto;
    background-color: #f8f8f8;
  }

  @media (min-width: 700px) {
    #app {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .content {
      box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.15);
    }
  }
</style>
