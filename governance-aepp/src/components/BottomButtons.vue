<template>
  <div>

    <div>

    </div>

    <div class="fixed bottom-0 left-0 h-12 mb-4 w-full">
      <!-- SEARCH BAR -->
      <div class="w-full flex h-full" v-if="view === 'search'">

        <div class="h-full w-12 ml-4 icon">
          <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg" @click="clickSearch">
            <img src="../assets/back.svg" class="w-8 h-8">
          </div>
        </div>

        <input type="search" class="rounded-full bg-white h-full flex justify-center items-center px-4 font-semibold w-full mx-4 search-bar" />

        <div class="h-full w-12 mr-4 icon" >
          <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg">
            <img src="../assets/search.svg" class="w-8 h-8">
          </div>
        </div>
      </div>
      <!-- BUTTONS -->
      <div class="w-full flex h-full" v-if="view === 'buttons'">
        <!-- LEFT BUTTON> -->

        <div class="h-full w-12 ml-4 icon" v-if="home">
          <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg"
               @click="$router.push(`/`)">
            <img src="../assets/home.svg" class="w-8 h-8">
          </div>
        </div>
        <div class="h-full w-12 ml-4 icon" v-if="account">
          <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg"
               @click="$router.push(`/account/${account}`)">
            <img src="../assets/account.svg" class="w-8 h-8">
          </div>
        </div>

        <!-- CENTER SECTION -->
        <div class="ml-auto">
          <div class="rounded-full primary-bg px-8 h-full flex justify-center items-center text-white font-semibold" @click="ctaAction" v-if="ctaText">
            {{ctaText}}
          </div>
        </div>

        <!-- RIGHT BUTTONS -->
        <div class="ml-auto flex">
          <div class="h-full w-12 mr-4 icon" v-if="searchBar">
            <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg"
                 @click="clickSearch">
              <img src="../assets/search.svg" class="w-8 h-8">
            </div>
          </div>
          <div class="h-full w-12 mr-4 icon" v-if="addPoll">
            <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg"
                 @click="$router.push('/create')">
              <img src="../assets/create.svg" class="w-8 h-8">
            </div>
          </div>
          <div class="h-full w-12 mr-4 icon" v-if="back">
            <div class="rounded-full w-full h-full flex justify-center items-center shadow primary-bg"
                 @click="$router.go(-1)">
              <img src="../assets/back.svg" class="w-8 h-8">
            </div>
          </div>
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
  import {AeIcon, AeButton} from "@aeternity/aepp-components";

  export default {
    name: "BottomButtons",
    components: {AeButton, AeIcon},
    props: {
      account: {
        type: String,
        default: null
      },
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
    data() {
      return {
        view: 'buttons'
      }
    },
    methods: {
      clickSearch() {
        if(this.view === 'buttons') this.view = 'search';
        else if(this.view === 'search') this.view = 'buttons';
      }
    }
  }
</script>

<style scoped>
  .primary-bg {
    background-color: #FF0D6A;
  }
  .icon {
    min-width: 3rem;
  }
  .search-bar {
    border: 1px solid #FF0D6A;
  }
  textarea:focus, input:focus{
    outline: none;
  }
</style>
