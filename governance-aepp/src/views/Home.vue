<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <div class="fixed w-full top-0 max-w-desktop">
      <BlackHeader>
        Open Polls
      </BlackHeader>
      <div class="flex bg-gray-ae text-gray-200">
        <div v-if="pollOrdering" :class="{active: activeTab === 'hot'}" @click="activeTab = 'hot'" class="tab">
          HOT
        </div>
        <div :class="{active: activeTab === 'closing'}" @click="activeTab = 'closing'" class="tab">CLOSING</div>
        <div v-if="pollOrdering" :class="{active: activeTab === 'stake'}" @click="activeTab = 'stake'" class="tab">
          STAKE
        </div>
        <div :class="{active: activeTab === 'new'}" @click="activeTab = 'new'" class="tab">NEW</div>
        <div :class="{active: activeTab === 'closed'}" @click="activeTab = 'closed'" class="tab">CLOSED</div>
      </div>
    </div>
    <div class="mt-32">
      <transition name="fade">
        <div v-show="polls" class="mx-4 mt-6" :key="activeTab">
          <div class="my-2" v-for="[id, data] in polls">
            <PollListing :id="id" :data="data"/>
          </div>
        </div>
      </transition>

      <div v-if="!polls.length && !showLoading" class="text-gray-500 text-xl text-center my-8">
        Could not find any polls.
      </div>
    </div>
    <BottomButtons @search="filterPolls" :search-bar="true"></BottomButtons>
    <CriticalErrorOverlay :error="error" @continue="error = null"></CriticalErrorOverlay>
  </div>
</template>

<script>
  import aeternity from "~/utils/aeternity";
  import Backend from "~/utils/backend";
  import {AeIcon} from '@aeternity/aepp-components/src/components'
  import BiggerLoader from '../components/BiggerLoader'
  import PollListing from "~/components/PollListing";
  import BottomButtons from "~/components/BottomButtons";
  import BlackHeader from "~/components/BlackHeader";
  import CriticalErrorOverlay from "~/components/CriticalErrorOverlay";
  import axios from "axios";
  import BigNumber from 'bignumber.js'

  export default {
    name: 'Home',
    components: {BlackHeader, BottomButtons, PollListing, AeIcon, BiggerLoader, CriticalErrorOverlay},
    data() {
      return {
        error: null,
        showLoading: true,
        address: null,
        balance: null,
        activeTab: 'new',
        pollOverview: [],
        polls: [],
        allPolls: [],
        closedPolls: [],
        activePolls: [],
        pollOrdering: null
      }
    },
    watch: {
      activeTab() {
        this.showLoading = true;
        this.updateTabView();
        this.showLoading = false;
      }
    },
    methods: {
      updateTabView() {
        switch (this.activeTab) {
          case "hot":
            this.polls = this.activePolls.sort((a, b) => {
              return this.pollOrdering.ordering.indexOf(a[0]) - this.pollOrdering.ordering.indexOf(b[0])
            });
            break;
          case "stake":
            const stakeOrdering = this.pollOrdering.data.sort((a, b) => {
              return new BigNumber(b.totalStake).comparedTo(a.totalStake)
            }).map(poll => poll.id);
            this.polls = this.activePolls.sort((a, b) => {
              return stakeOrdering.indexOf(a[0]) - stakeOrdering.indexOf(b[0])
            });
            break;
          case "closing":
            this.polls = this.activePolls.filter(([_, data]) => data.close_height).sort((a, b) => {
              return (a[1].close_height || b[1].close_height) ? (!a[1].close_height ? 1 : !b[1].close_height ? 1 : a[1].close_height - b[1].close_height) : 0;
            });
            break;
          case "new":
            this.polls = this.activePolls.sort((a, b) => b[0] - a[0]);
            break;
          case "closed":
            this.polls = this.closedPolls.sort((a, b) => b[1].close_height - a[1].close_height);
            break;
        }
      },
      filterPolls(searchString) {
        this.updateTabView();
        this.polls = this.polls.filter(poll => poll[1].title.indexOf(searchString) > -1)
      }
    },
    async mounted() {
      await aeternity.initClient();

      if (aeternity.isTestnet() && aeternity.balance <= 5) {
        await axios.post(`https://testnet.faucet.aepps.com/account/${aeternity.address}`, {}, {headers: {'content-type': 'application/x-www-form-urlencoded'}}).catch(console.error)
      }
      if (!aeternity.isTestnet()) {
        // remove this for mainnet usage
        this.error = 'This Aepp is in testing mode, choose Testnet to use it, you will automatically be funded Testnet-tokens. In Base-Aepp you can find this in Settings -> Network.'
      }

      this.address = aeternity.address;
      this.balance = aeternity.balance;
      this.allPolls = await aeternity.polls();

      this.closedPolls = this.allPolls.filter(poll => poll[1].close_height && poll[1].close_height <= aeternity.height);
      this.activePolls = this.allPolls.filter(poll => !poll[1].close_height || poll[1].close_height > aeternity.height);

      await Backend.pollOrdering(false).then(pollOrdering => {
        this.pollOrdering = pollOrdering;
        this.activeTab = 'hot';
      }).catch(console.error);

      this.updateTabView();
      this.showLoading = false;
    }
  }
</script>

<style scoped>
  .bg-gray-ae {
    background-color: #333333;
  }

  .tab {
    @apply flex-1 text-center pb-2 relative;
    font-size: .825rem;
  }

  .tab.active {
    font-weight: bold;
  }

  .tab.active::after {
    content: "";
    border: 8px solid #333;
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    position: absolute;
    left: calc(50% - 8px);
    top: calc(100% - 8px);
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .3s;
  }

  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }

</style>
