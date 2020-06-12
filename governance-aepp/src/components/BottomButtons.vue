<template>
  <div class="flex justify-center w-full z-20">

    <div class="fixed bottom-0 h-16 items-center flex flex-wrap w-full max-w-desktop bottom-bar" :class="{'open': view === 'search'}">
      <!-- SEARCH BAR -->
      <div class="w-full flex h-16 px-8 items-center search-bar" v-if="view === 'search'">
        <label class="w-full h-full">
          <input v-model="searchString" type="search" placeholder="Search..."
                 class="flex-1 h-full flex justify-center items-center px-4 w-full"/>
        </label>
        <SmallButton :img="images.searchImg" v-if="searchButton"
                     @click="$emit('searchSubmit', searchString)"/>
      </div>
      <!-- BUTTONS -->
      <div class="w-full flex h-12" :id="htmlId">
        <!-- LEFT BUTTON> -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton :img="images.homeImg" @click="() => $route.path !== '/' && $router.push('/')"/>
          <SmallButton :img="images.accountImg" v-if="account"
                       @click="() => $route.path !== `/account/${account}` &&  $router.push(`/account/${account}`)">
          </SmallButton>
        </div>
        <!-- CENTER SECTION -->
        <div class="flex-2 flex justify-center">
          <button
            class="ae-button round px-8 h-full flex justify-center items-center text-white font-semibold cursor-pointer"
            @click="$emit('cta')" :disabled="ctaDisabled" v-if="ctaText">
            {{ctaText}}
          </button>
          <div
            class="ae-button round px-8 h-full flex justify-center items-center text-white font-semibold cursor-pointer relative"
            @click="clickSearch" v-if="searchBar" :class="{'search-button': view === 'search'}">
            Search
          </div>
        </div>

        <!-- RIGHT BUTTONS -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton :img="images.createImg" v-if="account"
                       @click="() => $route.path !== '/create' && $router.push('/create')"/>
          <SmallButton :img="images.backImg" @click="() => $router.go(-1)"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import SmallButton from "./SmallButton";
  import searchImg from '../assets/search.svg';
  import createImg from '../assets/create.svg';
  import accountImg from '../assets/account.svg';
  import homeImg from '../assets/home.svg';
  import backImg from '../assets/back.svg';
  import aeternity from "../utils/aeternity";
  import { EventBus } from '../utils/eventBus';

  export default {
    name: "BottomButtons",
    components: {SmallButton},
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
      },
      searchButton: {
        type: Boolean,
        default: false
      },
      htmlId: {
        type: String
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
      },
      async loadData()  {
        if (!aeternity.static) {
          this.account = await aeternity.client.address()
        }
      }
    },
    created() {
      EventBus.$on('dataChange', this.loadData)
      this.loadData()
    },
    beforeDestroy() {
      EventBus.$off('dataChange', this.loadData)
    }
  }
</script>

<style scoped>
  textarea:focus, input:focus {
    outline: none;
  }

  .justify-evenly {
    justify-content: space-evenly;
  }

  .flex-2 {
    flex: 2 1 0;
  }

  .open {
    height: 146px;
  }

  .search-button::before {
    content: "";
    border: 10px solid #2a9cff;
    transform: rotate(45deg);
    position: absolute;
    top: -10px;
    left: calc(50% - 10px);
    width: 20px;
    height: 20px;
  }

  .bottom-bar {
    background: #272831;
  }

  .search-bar input {
    background: #272831;
  }

  button[disabled] {
    @apply text-gray-500 cursor-not-allowed
  }
</style>
