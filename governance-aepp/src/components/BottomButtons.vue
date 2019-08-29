<template>
  <div>
    <div class="fixed bottom-0 left-0 h-12 mb-4 w-full">
      <!-- SEARCH BAR -->
      <div class="w-full flex h-full" v-if="view === 'search'">
        <div class="h-full w-12 ml-4 icon flex items-center">
          <div class="rounded-full w-full flex justify-center items-center shadow bg-primary"
               @click="clickSearch">
            <img src="../assets/back.svg" class="w-8">
          </div>
        </div>
        <input type="search"
               class="rounded-full bg-white h-full flex justify-center items-center px-4 font-semibold w-full mx-4 search-bar"/>
        <div class="h-full w-12 mr-4 icon flex items-center">
          <div class="rounded-full w-full flex justify-center items-center shadow bg-primary">
            <img src="../assets/search.svg" class="w-8">
          </div>
        </div>
      </div>
      <!-- BUTTONS -->
      <div class="w-full flex h-full" v-if="view === 'buttons'">
        <!-- LEFT BUTTON> -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton :img="images.homeImg" :action="() => $router.push('/')"></SmallButton>
          <SmallButton :img="images.accountImg"
                       :action="() => $router.push(`/account/${account}`)"></SmallButton>
        </div>

        <!-- CENTER SECTION -->
        <div class="flex-3">
          <div class="rounded-full bg-primary px-8 h-full flex justify-center items-center text-white font-semibold"
               @click="ctaAction" v-if="ctaText">
            {{ctaText}}
          </div>
          <div class="rounded-full bg-primary px-8 h-full flex justify-center items-center text-white font-semibold"
               @click="clickSearch" v-if="searchBar">
            Search
          </div>
        </div>

        <!-- RIGHT BUTTONS -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton :img="images.createImg" :action="() => $router.push('/create')"></SmallButton>
          <SmallButton :img="images.backImg" :action="() => $router.go(-1)"></SmallButton>
        </div>
      </div>
    </div>
    <!--
    <div @click="$router.push(`/account/${address}`)" class="fixed bottom-0 left-0 p-8">
      <ae-icon name="contacts" fill="primary" face="round"
               class="ae-icon-size shadow"></ae-icon>
    </div>
    -->
  </div>
</template>

<script>
  import {AeIcon, AeButton} from "@aeternity/aepp-components/src/components";
  import SmallButton from "~/components/SmallButton";
  import searchImg from '../assets/search.svg';
  import createImg from '../assets/create.svg';
  import accountImg from '../assets/account.svg';
  import homeImg from '../assets/home.svg';
  import backImg from '../assets/back.svg';
  import aeternity from "~/utils/aeternity";

  export default {
    name: "BottomButtons",
    components: {SmallButton, AeButton, AeIcon},
    data() {
      return {
        view: 'buttons',
        images: {searchImg, createImg, accountImg, homeImg, backImg},
        account: null
      }
    },
    props: {
      home: {
        type: Boolean,
        default: true
      },
      searchBar: {
        type: Boolean,
        default: false
      },
      addPoll: {
        type: Boolean,
        default: false
      },
      back: {
        type: String,
        default: null
      },
      ctaText: {
        type: String,
        default: null
      },
      ctaAction: {
        type: Function,
        default: () => {
        }
      }
    },
    methods: {
      clickSearch() {
        if (this.view === 'buttons') this.view = 'search';
        else if (this.view === 'search') this.view = 'buttons';
      }
    },
    created() {
      this.account = aeternity.address
    }
  }
</script>

<style scoped>
  .search-bar {
    border: 1px solid #FF0D6A;
  }

  textarea:focus, input:focus {
    outline: none;
  }

  .justify-evenly {
    justify-content: space-evenly;
  }

  .flex-2 {
    flex: 2 1 0;
  }

  .flex-3 {
    flex: 3 1 0;
  }
</style>
