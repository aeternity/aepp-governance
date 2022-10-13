<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader/>
    </div>
    <div class="fixed w-full top-0 max-w-desktop">
      <BlackHeader :show-number-input="true" @submit.self="showPoll" @input="handleIdInput">
        {{activeTab}} Polls
      </BlackHeader>
      <div class="flex bg-gray-ae text-gray-200" id="home-tab-switcher">
        <div v-if="pollOrdering" :class="{active: activeTab === 'hot'}" @click="switchTab('hot')" class="tab flex-1 text-center pb-2 relative">
          <span class="cursor-pointer inline-block">HOT</span>
        </div>
        <div :class="{active: activeTab === 'closing'}" @click="switchTab('closing')" class="tab flex-1 text-center pb-2 relative">
          <span class="cursor-pointer inline-block">CLOSING</span>
        </div>
        <div v-if="pollOrdering" :class="{active: activeTab === 'stake'}" @click="switchTab('stake')" class="tab flex-1 text-center pb-2 relative">
          <span class="cursor-pointer inline-block">STAKE</span>
        </div>
        <div :class="{active: activeTab === 'new'}" @click="switchTab('new')" class="tab flex-1 text-center pb-2 relative">
          <span class="cursor-pointer inline-block">NEW</span>
        </div>
        <div :class="{active: activeTab === 'closed'}" @click="switchTab('closed')" class="tab flex-1 text-center pb-2 relative">
          <span class="cursor-pointer inline-block">CLOSED</span>
        </div>
      </div>
    </div>
    <div class="mt-32" id="home-poll-list">
      <transition name="fade">
        <div v-show="polls" class="mx-4 mt-6" :key="activeTab">
          <div class="my-2" :key="id" v-for="[id, data] in polls">
            <PollListing :id="Number(id)" :data="data"/>
          </div>
        </div>
      </transition>

      <div v-if="!polls.length && !showLoading" class="text-gray-500 text-xl text-center my-8">
        Could not find any polls.
      </div>
    </div>
    <BottomButtons htmlId="home-nav-buttons" v-if="showSearch" @search="filterPolls" :search-bar="true"/>
    <BottomButtons htmlId="home-nav-buttons" v-else @cta="showPoll(pollId)" cta-text="Show Poll"/>
    <CriticalErrorOverlay :error="error" @continue="error = null"/>
  </div>
</template>

<script>
  import {sdk, wallet} from '@/utils/wallet';
  import Backend from '../utils/backend';
  import BiggerLoader from '../components/BiggerLoader';
  import PollListing from '../components/PollListing';
  import BottomButtons from '../components/BottomButtons';
  import BlackHeader from '../components/BlackHeader';
  import CriticalErrorOverlay from '../components/CriticalErrorOverlay';
  import BigNumber from 'bignumber.js';
  import contract from "@/utils/contract";

  export default {
    name: 'HomePage',
    components: { BlackHeader, BottomButtons, PollListing, BiggerLoader, CriticalErrorOverlay },
    data() {
      return {
        error: null,
        showLoading: true,
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
        if (this.allPolls.find(poll => poll[0] === BigInt(id)))
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
            this.polls = this.activePolls.filter(([id]) => this.pollOrdering.ordering.includes(Number(id))).sort((a, b) => {
              return this.pollOrdering.ordering.indexOf(Number(a[0])) - this.pollOrdering.ordering.indexOf(Number(b[0]));
            });
            break;
          case 'stake':
            // eslint-disable-next-line no-case-declarations
            const stakeOrdering = this.pollOrdering.data.sort((a, b) => {
              return new BigNumber(b.totalStake).comparedTo(a.totalStake);
            }).map(poll => poll.id);
            this.polls = this.activePolls.sort((a, b) => {
              return stakeOrdering.indexOf(Number(a[0])) - stakeOrdering.indexOf(Number(b[0]));
            });
            break;
          case 'closing':
            this.polls = this.activePolls.filter(([, data]) => data.close_height).sort((a, b) => {
              return (a[1].close_height || b[1].close_height) ? (!a[1].close_height ? 1 : !b[1].close_height ? 1 : Number(a[1].close_height) - Number(b[1].close_height)) : 0;
            });
            break;
          case 'new':
            this.polls = this.activePolls.sort((a, b) => Number(b[0]) - Number(a[0]));
            break;
          case 'closed':
            this.polls = this.closedPolls.sort((a, b) => Number(b[1].close_height) - Number(a[1].close_height));
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
        if (wallet.address && wallet.networkId ==='ae_uat' && wallet.balance && Number(wallet.balance) < 5) {
          await fetch(`https://testnet.faucet.aepps.com/account/${wallet.address}`,
            {
              headers: { 'content-type': 'application/x-www-form-urlencoded' },
              method: 'POST',
            }).catch(console.error);
        }

        const fetchPolls = contract.polls().catch(e => {
          console.error(e);
          this.error = 'Could not fetch polls.';
        });
        const fetchOrdering = new Backend(wallet.networkId).pollOrdering(false).catch(console.error);
        const [allPolls, pollOrdering] = await Promise.all([fetchPolls, fetchOrdering]);

        this.pollOrdering = pollOrdering;
        this.allPolls = allPolls.filter(([, data]) => data.title.length <= 50);

        if (this.allPolls) {
          let height = BigInt(await sdk.getHeight())

          this.closedPolls = this.allPolls.filter(([, poll]) => poll.is_listed).filter(([, poll]) => poll.close_height && poll.close_height <= height);
          this.activePolls = this.allPolls.filter(([, poll]) => poll.is_listed).filter(([, poll]) => !poll.close_height || poll.close_height > height);
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
    },

    async mounted() {
      this.eventBus.on('dataChange', this.loadData);

      await this.loadData();
    },
    created() {
      this.activeTab = this.$route.query.tab ? this.$route.query.tab : null;
    },
    beforeUnmount() {
      document.removeEventListener('touchstart', this.touchStartEvent, false);
      document.removeEventListener('touchend', this.touchEndEvent, false);
      this.eventBus.off('dataChange', this.loadData);
    },
  };
</script>

<style lang="scss" scoped>
  .bg-gray-ae {
    background-color: #333333;
  }

  .tab {
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
</style>
