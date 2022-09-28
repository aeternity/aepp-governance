<template>
  <div id="app" class="min-h-screen">
    <Explainer></Explainer>
    <HintOverlay></HintOverlay>
    <div class="content min-h-screen max-w-desktop z-10">
      <div class="min-h-screen wrapper" ref="wrapper">
        <router-view v-if="isConnected" :resetView="resetView"></router-view>
        <template v-else>
          <div class="inset-0 flex justify-center flex-col items-center z-50">
            <BiggerLoader></BiggerLoader>
            <h2 class="mt-2 font-bold">Looking for a wallet. Check for popups.</h2>
          </div>
        </template>
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

import CriticalErrorOverlay from './components/CriticalErrorOverlay';
import Explainer from './components/Explainer';
import {wallet} from './utils/wallet';
import BiggerLoader from './components/BiggerLoader';
import HintOverlay from './components/HintOverlay';
import {toRefs} from "vue";
import {initWallet} from './utils/wallet'
import contract from "@/utils/contract";

export default {
  name: 'App',
  components: {BiggerLoader, CriticalErrorOverlay, Explainer, HintOverlay},
  data() {
    return {
      error: null,
      errorCTA: null,
      foundWallet: false,
      isConnected: false,
      ignoreErrors: (window.location.host.includes('localhost') || window.location.host.includes('0.0.0.0')),
      errorClick: () => {
      },
    };
  },
  setup() {
    const {walletStatus, networkId} = toRefs(wallet)
    return {walletStatus, networkId}
  },
  watch: {
    networkId() {
      this.isConnected = false;
    },
    async walletStatus(status) {
      if (status === 'connected' && !this.isConnected) {
        await contract.init();
        this.isConnected = true
      }
    }
  },
  async mounted() {
    await initWallet(this.eventBus)
  },
  methods: {
    resetView() {
      this.$refs.wrapper.scrollTo(0, 0);
    },
  },

};
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
