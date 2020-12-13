<template>
   <div class="flex justify-center w-full z-20">
 
    <div class="fixed bottom-0 h-16 items-center flex flex-wrap w-full max-w-desktop bg-black-100 rounded"
          :class="{'open': view === 'search'}">
       <!-- SEARCH BAR -->
       <div class="w-full flex h-16 px-8 items-center search-bar" v-if="view === 'search'">
        <label class="w-full h-full">
          <input v-model="searchString" type="search" placeholder="Search..."
                 class="flex-1 h-full flex justify-center items-center text-white px-4 w-full  bg-gray-900"/>
        </label>
        <SmallButton :img="images.searchImg" v-if="searchButton"
                     @click="$emit('searchSubmit', searchString)"/>
      </div>
      <!-- BUTTONS -->
      <div class="w-full flex h-12" :id="htmlId">
      <!-- LEFT BUTTON> -->
        <div class="flex justify-evenly items-center h-full flex-2">
          <SmallButton 
            :img="images.homeImg" @click="() => $route.path !== '/' && $router.push('/')"
          class="nav-button"
          />
          <SmallButton 
            :img="$route.name === 'account' ? images.accountImgActive : images.accountImg"
            v-if="account"
            @click="() => $route.path !== `/account/${account}` &&  $router.push(`/account/${account}`)"
          class="nav-button"
            :class="{active: $route.name === 'account'}"
          >
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
          class="ae-button round px-rem h-full flex justify-center items-center text-white font-semibold cursor-pointer relative"
            @click="clickSearch" v-if="searchBar" :class="{'search-button': view === 'search'}">
            Search
          </div>
        </div>

        <!-- RIGHT BUTTONS -->
        <div class="flex justify-evenly items-center h-full flex-2">
           <SmallButton 
             :img="$route.name === 'create' ? images.createImgActive : images.createImg" 
             v-if="account"
             @click="() => $route.path !== '/create' && $router.push('/create')"
            class="nav-button"
            :class="{active: $route.name === 'create'}"
          />
          <SmallButton
            :img="images.backImg" @click="() => $router.go(-1)"
            class="nav-button"
           />
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
  import accountImgActive from '../assets/accountActive.svg';
  import createImgActive from '../assets/createActive.svg';
  import homeImg from '../assets/home.svg';
  import homeImgActive from '../assets/homeActive.svg';
  import backImg from '../assets/back.svg';
  import backImgActive from '../assets/backActive.svg';
  import aeternity from "../utils/aeternity";
  import { EventBus } from '../utils/eventBus';

  export default {
    name: "BottomButtons",
    components: {SmallButton},
    data() {
      return {
        view: 'buttons',
        images: {searchImg, createImg, accountImg, homeImg, backImg,
            createImgActive, accountImgActive, homeImgActive, backImgActive},
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

<style scoped lang="scss">
  .open {
    height: 9.125rem;
  }
 
  .search-button::before {
    content: "";
    border: 0.625rem solid #1161fe;
    transform: rotate(45deg);
    position: absolute;
    top: -0.625rem;
    left: calc(50% - 0.625rem);
    width: 1.25rem;
    height: 1.25rem;
  }

  button[disabled] {
    @apply text-gray-500 cursor-not-allowed;
  }
   
  .ae-button {
    height: 2.5rem;

    &:hover {
      background-color: #0F57E5;
    }
  }

  .nav-button {
    height: 2.5rem;
    width: 2.5rem;
    border-radius: 50%;

    &:hover {
      background-color: #000;

      &.active {
        background-color: rgba(0, 255, 157, 0.1);
      }
    }
  }
</style>
