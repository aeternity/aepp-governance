<template>
  <div class="flex justify-center w-full">

    <div class="fixed bottom-0 h-12 pb-8 w-full max-w-desktop bottom-bar" :class="{'h-32': view === 'search'}">
      <!-- SEARCH BAR -->
      <div class="w-full flex h-12 mb-6" v-if="view === 'search'">
        <input v-model="searchString" type="search" placeholder="Search..."
               class="rounded-full bg-white h-full flex justify-center items-center px-4 w-full mx-8 search-bar"/>
      </div>
      <!-- BUTTONS -->
      <div class="w-full flex h-12">
        <!-- LEFT BUTTON> -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton :img="images.homeImg" :action="() => $route.path !== '/' && $router.push('/')"></SmallButton>
          <SmallButton :img="images.accountImg" v-if="account"
                       :action="() => $route.path !== `/account/${account}` &&  $router.push(`/account/${account}`)">
          </SmallButton>
        </div>
        <!-- CENTER SECTION -->
        <div class="flex-3">
          <button class="rounded-full bg-primary px-8 h-full flex justify-center items-center text-white font-semibold"
               @click="$emit('cta')" :disabled="ctaDisabled" v-if="ctaText">
            {{ctaText}}
          </button>
          <div class="rounded-full bg-primary px-8 h-full flex justify-center items-center text-white font-semibold relative"
               @click="clickSearch" v-if="searchBar" :class="{'search-button': view === 'search'}">
            Search
          </div>
        </div>

        <!-- RIGHT BUTTONS -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton :img="images.createImg" v-if="account"
                       :action="() => $route.path !== '/create' && $router.push('/create')"></SmallButton>
          <SmallButton :img="images.backImg" :action="() => $router.go(-1)"></SmallButton>
        </div>
      </div>
    </div>
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
        account: null,
        searchString: ''
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
      },
      ctaDisabled: {
        type: Boolean,
        default: false
      }
    },
    watch: {
      searchString() {
        this.$emit('search', this.searchString)
      }
    },
    methods: {
      clickSearch() {
        if (this.view === 'buttons') this.view = 'search';
        else if (this.view === 'search') this.view = 'buttons';
      }
    },
    created() {
      if (!aeternity.passive) {
        this.account = aeternity.address
      }
    }
  }
</script>

<style scoped>
  .search-bar {
    box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.15);
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

  .search-button::after {
    content: "";
    border: 10px solid #FF0D6A;
    transform: rotate(45deg);
    position: absolute;
    top: -10px;
    left: calc(50% - 10px);
    width: 20px;
    height: 20px;
  }

  .bottom-bar {
    background-image: linear-gradient(to bottom, rgba(255, 0, 0, 0), #f8f8f8);
    border-bottom: solid 1.5rem #f8f8f8;
  }

  button[disabled] {
    @apply text-gray-500 cursor-not-allowed
  }
</style>
