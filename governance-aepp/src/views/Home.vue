<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader/>
    </div>
    <div class="sticky w-full top-0 max-w-desktop z-20">
      <BlackHeader :show-number-input="true" @submit="showPoll" @input="handleIdInput">
        {{getTabLabelByValue(activeTab)}} Polls
      </BlackHeader>
      <div class="px-4 space-x-3 sm:space-x-5 font-bold md:font-lg flex text-gray-500 bg-gray-700" id="home-tab-switcher">
        <div v-if="pollOrdering" :class="{active: activeTab === 'hot'}" @click="switchTab('hot')" class="tab">
          <span>{{getTabLabelByValue('hot')}}</span>
        </div>
        <div :class="{active: activeTab === 'closing'}" @click="switchTab('closing')" class="tab">
          <span>{{getTabLabelByValue('closing')}}</span>
        </div>
        <div v-if="pollOrdering" :class="{active: activeTab === 'stake'}" @click="switchTab('stake')" class="tab">
          <span>{{getTabLabelByValue('stake')}}</span>
        </div>
        <div :class="{active: activeTab === 'new'}" @click="switchTab('new')" class="tab">
          <span>{{getTabLabelByValue('new')}}</span>
        </div>
        <div :class="{active: activeTab === 'closed'}" @click="switchTab('closed')" class="tab">
          <span>{{getTabLabelByValue('closed')}}</span>
        </div>
      </div>
    </div>
    <div id="home-poll-list" class="p-3 md:p-4 poll-list relative">
      <transition name="fade">
        <div v-show="polls" :key="activeTab">
          <div class="list-item" :key="id" v-for="[id, data] in polls">
            <PollListing :id="id" :data="data"/>
          </div>
        </div>
      </transition>
      <div v-if="!polls.length && !showLoading" class="text-gray-500 text-xl text-center -translate-y-1/2 absolute top-half w-full">
        Could not find any polls.
      </div>
    </div>
    <BottomButtons htmlId="home-nav-buttons" v-if="showSearch" @search="filterPolls" :search-bar="true"/>
    <BottomButtons htmlId="home-nav-buttons" v-else @cta="showPoll(pollId)" cta-text="Show Poll"/>
    <CriticalErrorOverlay :error="error" @continue="error = null"/>
  </div>
</template>

<script>
  import aeternity from '../utils/aeternity';
  import Backend from '../utils/backend';
  import BiggerLoader from '../components/BiggerLoader';
  import PollListing from '../components/PollListing';
  import BottomButtons from '../components/BottomButtons';
  import CriticalErrorOverlay from '../components/CriticalErrorOverlay';
  import BigNumber from 'bignumber.js';
  import { EventBus } from '../utils/eventBus';
  import Util from '../utils/util';
  import blacklistJSON from '../data/blacklist.json';
  import BlackHeader from '../components/BlackHeader';

  export default {
    name: 'Home',
    components: { BlackHeader, BottomButtons, PollListing, BiggerLoader, CriticalErrorOverlay },
    data() {
      return {
        error: null,
        showLoading: true,
        address: null,
        balance: null,
        activeTab: null,
        availableTabs: ['hot', 'closing', 'stake', 'new', 'closed'],
        pollOverview: [],
        polls: [],
        allPolls: [],
        closedPolls: [],
        activePolls: [],
        pollOrdering: null,
        showSearch: true,
        pollId: null,
        startPosition: {
          x: null,
          y: null,
        },
      };
    },
    watch: {
      '$route.query.tab'() {
        this.activeTab = this.$route.query.tab;
        this.showLoading = true;
        this.updateTabView();
        this.showLoading = false;
      },
    },
    props: ['resetView'],
    methods: {
      handleIdInput(id) {
        if (id) {
          this.showSearch = false;
          this.pollId = id;
        }
      },
      showPoll(id) {
        if (this.allPolls.find(poll => poll[0] === parseInt(id)))
          this.$router.push(`/poll/${id}`);
        else
          this.error = `Could not find poll with id "${id}".`;
      },
      switchTab(newTab) {
        if (this.activeTab !== newTab) this.$router.push({ query: { tab: newTab } });
      },
      updateTabView() {
        this.resetView();

        switch (this.activeTab) {
          case 'hot':
            this.polls = this.activePolls.filter(([id, _]) => this.pollOrdering.ordering.includes(id)).sort((a, b) => {
              return this.pollOrdering.ordering.indexOf(a[0]) - this.pollOrdering.ordering.indexOf(b[0]);
            });
            break;
          case 'stake':
            // eslint-disable-next-line no-case-declarations
            const stakeOrdering = this.pollOrdering.data.sort((a, b) => {
              return new BigNumber(b.totalStake).comparedTo(a.totalStake);
            }).map(poll => poll.id);
            this.polls = this.activePolls.sort((a, b) => {
              return stakeOrdering.indexOf(a[0]) - stakeOrdering.indexOf(b[0]);
            });
            break;
          case 'closing':
            this.polls = this.activePolls.filter(([_, data]) => data.close_height).sort((a, b) => {
              return (a[1].close_height || b[1].close_height) ? (!a[1].close_height ? 1 : !b[1].close_height ? 1 : a[1].close_height - b[1].close_height) : 0;
            });
            break;
          case 'new':
            this.polls = this.activePolls.sort((a, b) => b[0] - a[0]);
            break;
          case 'closed':
            this.polls = this.closedPolls.sort((a, b) => b[1].close_height - a[1].close_height);
            break;
        }
      },
      filterPolls(searchString) {
        // Reset filter
        this.updateTabView();

        // ONLY NUMBERS?
        if (/^\d+$/.test(searchString)) this.polls = this.polls.filter(poll => poll[0] === parseInt(searchString));
        else this.polls = this.polls.filter(poll => poll[1].title.toLowerCase().indexOf(searchString.toLowerCase()) > -1);
      },
      touchStartEvent(event) {
        this.startPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      },
      touchEndEvent(event) {
        const diff = {
          x: event.changedTouches[event.changedTouches.length - 1].clientX - this.startPosition.x,
          y: event.changedTouches[event.changedTouches.length - 1].clientY - this.startPosition.y,
        };
        if (Math.abs(diff.x) > Math.abs(diff.y) && Math.abs(diff.x) > 100) {
          this.swipeTab(diff.x);
        }
        this.startPosition = { x: null, y: null };
      },
      swipeTab(diffX) {
        const currentIndex = this.availableTabs.indexOf(this.activeTab);
        let direction = diffX > 0 ? -1 : 1;
        if (currentIndex + direction < 0) direction = 4;
        this.switchTab(this.availableTabs[(currentIndex + direction) % this.availableTabs.length]);
      },
      async loadData() {
        if(!aeternity.static) {
          this.address = await aeternity.client.address();
          this.balance = await aeternity.client.getBalance(this.address);

          if (!aeternity.isMainnet() && Util.atomsToAe(this.balance) <= 5) {
            await fetch(`https://testnet.faucet.aepps.com/account/${this.address}`,
              {
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                method: 'POST',
              }).catch(console.error);
          }
        }

        const fetchPolls = aeternity.polls().catch(e => {
          console.error(e);
          this.error = 'Could not fetch polls.';
        });
        const fetchOrdering = new Backend(aeternity.networkId).pollOrdering(false).catch(console.error);
        const fetchBlacklist = new Backend(aeternity.networkId).getBlacklistedPolls().catch(() => blacklistJSON);
        const [allPolls, pollOrdering, blacklist] = await Promise.all([fetchPolls, fetchOrdering, fetchBlacklist]);

        this.pollOrdering = pollOrdering;
        this.allPolls = allPolls.filter(([_, data]) => data.title.length <= 50);
        const publicPolls = allPolls.filter(([_, data]) => data.is_listed).filter(([id]) => !blacklist[aeternity.networkId].includes(id));

        if (this.allPolls) {
          let height = await aeternity.client.height()
          this.closedPolls = publicPolls.filter(poll => typeof poll[1].close_height === 'number' && poll[1].close_height <= height);
          this.activePolls = publicPolls.filter(poll => typeof poll[1].close_height !== 'number' || poll[1].close_height > height);
        }

        // Only overwrite if active tab is not set yet
        if (!this.activeTab) this.activeTab = this.pollOrdering ? 'hot' : 'new';
        // Fallback if poll order fetching fails
        if ((this.activeTab === 'stake' || this.activeTab === 'hot') && !this.pollOrdering) this.activeTab = 'new';
        // Update available tabs if there is no backend
        if (!this.pollOrdering) this.availableTabs = ['closing', 'new', 'closed'];

        this.updateTabView();

        document.addEventListener('touchstart', this.touchStartEvent, false);
        document.addEventListener('touchend', this.touchEndEvent, false);
        this.showLoading = false;

      },

      getTabLabelByValue(tabValue) {
        let tabText = ''

        switch (tabValue) {
          case 'hot':
            tabText = 'Trending'
            break;
          case 'stake':
           tabText = 'Stake'
            break;
          case 'closing':
           tabText = 'Ending soon'
            break;
          case 'new':
             tabText = 'Latest'
            break;
          case 'closed':
            tabText = 'Closed'
            break;
        }

        return tabText;
      }
    },

    async mounted() {
      EventBus.$on('dataChange', this.loadData);

      await this.loadData();
    },
    created() {
      this.activeTab = this.$route.query.tab ? this.$route.query.tab : null;
    },
    beforeDestroy() {
      document.removeEventListener('touchstart', this.touchStartEvent, false);
      document.removeEventListener('touchend', this.touchEndEvent, false);
      EventBus.$off('dataChange', this.loadData);
    },
  };
</script>

<style lang="scss" scoped>
  .tab {
    border-bottom: 0.125rem solid transparent;
    cursor: pointer;
    padding: 0.9375rem 0;
    white-space: nowrap;
  }

  .tab.active {
    color: #67F7B8;
    border-bottom: 2px solid #67F7B8;
  }

  .poll-list {
    min-height: calc(100vh - 14rem);
  }

  @media (max-device-width: 480px) {
    .tab {
      padding-bottom: 0.625rem;
    }
  }
</style>
