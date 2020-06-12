<template>
  <div class="w-full top-0 max-w-desktop">
    <BlackHeader>
      Help & Hints
    </BlackHeader>
    
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
  import help from '../data/help.json';
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
  .ae-card {
    background: #292b35;
    color: #aeaeae;
  }
  h1 {
    color: #fff;
  }
  p {
    color: #aeaeae;
  }
</style>
