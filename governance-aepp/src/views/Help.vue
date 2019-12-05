<template>
  <div class="w-full top-0 max-w-desktop">
    <BlackHeader>
      Help & Hints
    </BlackHeader>
    <div class="m-4 ae-card cursor-pointer" @click="toggleCard()">
      <div class="flex justify-between items-center w-full py-4 px-3">
        <img src="../assets/warning-24px.svg" alt="warning symbol">
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
    <div v-if="views">
      <div class="p-4" v-for="key in Object.keys(views)" :key="key">
        <h1 class="text-3xl">{{views[key].headline}}</h1>
        <p>{{views[key].text}}</p>
      </div>
    </div>

    <div class="relative h-4 mt-6 w-full">
      <div class="absolute inset-0 flex h-full w-full justify-center items-center px-4">
        <div class="border w-full"></div>
      </div>
    </div>

    <div class="text-center w-full mt-1 text-xs relative">
      <div class="opacity-40">
        aepp: GIT_REV
      </div>
    </div>
    <div class="text-center w-full mt-1 text-xs relative">
      <div class="opacity-40">
        server: {{serverVersion}}
      </div>
    </div>

    <BottomButtons/>
  </div>
</template>

<script>
  import BlackHeader from "../components/BlackHeader";
  import BottomButtons from "../components/BottomButtons";
  import copy from 'copy-to-clipboard';
  import help from '../assets/help.json';
  import aeternity from "../utils/aeternity";
  import Backend from "../utils/backend";

  export default {
    name: 'Help',
    components: {BlackHeader, BottomButtons},
    data() {
      return {
        serverVersion: "",
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
    mounted() {
      new Backend(aeternity.networkId).version().then(data => {
        this.serverVersion = data.version
      })
    }
  }
</script>

<style scoped>
</style>
