<template>
  <div class="fixed w-full top-0 max-w-desktop">
    <BlackHeader>
      Testing Mode
    </BlackHeader>
    <div class="p-4">
      The Governance Aepp is still in testing mode, this means <span class="font-bold">the aeternity crypto foundation did not finally decide
      how to take results into effect</span>, that are outcome of signaling on polls in the governance aepp.
    </div>
    <div class="p-4">
      Additionally participating with <span class="font-bold">ledger hardware wallets is still not supported</span> and
      this may result in distorted signaling
      results.
    </div>
    <div class="text-primary p-4 font-xl relative">
      <a href="https://forum.aeternity.com/t/governance-aepp-launch/5281" @click.stop.prevent="openLink"
         class="">Take part in our discussion in the Forum!</a>
      <transition name="fade">
        <div class="absolute inset-0 bg-gray-500 text-white p-2 rounded" v-if="showCopyNotice">
          Copied link to clipboard
        </div>
      </transition>
    </div>
    <BottomButtons></BottomButtons>

  </div>
</template>

<script>
  import BlackHeader from "../components/BlackHeader";
  import BottomButtons from "~/components/BottomButtons";
  import copy from 'copy-to-clipboard';

  export default {
    name: 'Testing Mode',
    components: {BlackHeader, BottomButtons},
    data() {
      return {
        showCopyNotice: false
      }
    },
    methods: {
      openLink() {
        if (window.parent === window) {
          window.open('https://forum.aeternity.com/t/governance-aepp-launch/5281');
        } else {
          copy('https://forum.aeternity.com/t/governance-aepp-launch/5281');
          this.showCopyNotice = true;
          setTimeout(() => {
            this.showCopyNotice = false
          }, 1500)
        }
      }
    }
  }
</script>

<style scoped>
</style>
