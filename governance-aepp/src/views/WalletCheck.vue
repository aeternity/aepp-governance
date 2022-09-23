<template>
  <div class="inset-0 flex justify-center flex-col items-center z-50">
    <BiggerLoader></BiggerLoader>
    <h2 class="mt-2 font-bold">Looking for a wallet. Check for popups.</h2>
  </div>
</template>


<script>

import BiggerLoader from "@/components/BiggerLoader";
import {toRefs} from "vue";
import {initWallet, wallet} from "@/utils/wallet";

export default {
  name: 'WalletCheckPage',
  components: {
    BiggerLoader,
  },
  setup() {
    const {walletStatus} = toRefs(wallet)
    return {walletStatus}
  },
  watch: {
    walletStatus(status) {
      if (status === 'connected') this.$router.push(`/home`)
    }
  },
  mounted: async () => {
    await initWallet()
  },
}
</script>
