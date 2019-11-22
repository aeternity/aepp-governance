<template>
  <div class="w-full top-0 max-w-desktop">
    <BlackHeader>
      Help & Hints
    </BlackHeader>
    <div class="m-4 ae-card cursor-pointer" @click="toggleCard()">
      <div class="flex justify-between items-center w-full py-4 px-3">
        <div class="w-8 text-2xl h-8 bg-yellow-400 rounded-full justify-center flex items-center text-white">
          !
        </div>
        <div class="mr-auto ml-2" style="margin-top: 4px">
          <span class="font-bold">The Governance Aepp is still in testing mode.</span>
        </div>
        <div class="min-w-3" style="margin-top: 4px">
          <img src="../assets/back_gray.svg" class="ae-transition-300" alt="show poll state"
               :class="{'rotate-90': showCard}">
        </div>
      </div>
      <div v-show="showCard">
        <div class="p-4">
          This means <span class="font-bold">the aeternity crypto foundation did not finally decide how to take results into effect</span>,
          that are outcome of signaling on polls in the governance aepp.
        </div>
        <div class="p-4">
          Additionally participating with <span class="font-bold">ledger hardware wallets is still not supported</span>
          and this may result in distorted signaling results.
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
      </div>
    </div>
    <div class="p-4" v-for="key in Object.keys(views)" v-if="views">
      <h1 class="text-3xl">{{views[key].headline}}</h1>
      <p>{{views[key].text}}</p>
    </div>
    <BottomButtons></BottomButtons>
  </div>
</template>

<script>
  import BlackHeader from "~/components/BlackHeader";
  import BottomButtons from "~/components/BottomButtons";
  import copy from 'copy-to-clipboard';
  import help from '~/assets/help.json';

  export default {
    name: 'Help',
    components: {BlackHeader, BottomButtons},
    data() {
      return {
        showCopyNotice: false,
        showCard: false,
        views: help
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
      },
      toggleCard() {
        this.showCard = !this.showCard
      }
    },
  }
</script>

<style scoped>
</style>
