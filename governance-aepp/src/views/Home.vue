<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader/>
    </div>
    <div class="fixed w-full top-0 max-w-desktop">
      <div class="tab-switcher" id="home-tab-switcher">
        <div v-if="pollOrdering" :class="{active: activeTab === 'hot'}" @click="switchTab('hot')" class="tab">
          <span>Hot Polls</span>
        </div>
        <div :class="{active: activeTab === 'closing'}" @click="switchTab('closing')" class="tab">
          <span>Closing</span>
        </div>
        <div v-if="pollOrdering" :class="{active: activeTab === 'stake'}" @click="switchTab('stake')" class="tab">
          <span>Stake</span>
        </div>
        <div :class="{active: activeTab === 'new'}" @click="switchTab('new')" class="tab">
          <span>New</span>
        </div>
        <div :class="{active: activeTab === 'closed'}" @click="switchTab('closed')" class="tab">
          <span>Closed</span>
        </div>
      </div>
    </div>
    <div id="home-poll-list" class="poll-list">
      <transition name="fade">
        <div v-show="polls" :key="activeTab">
          <div class="list-item" :key="id" v-for="[id, data] in polls">
            <PollListing :id="id" :data="data"/>
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
  import aeternity from "../utils/aeternity";
  import Backend from "../utils/backend";
  import BiggerLoader from '../components/BiggerLoader';
  import PollListing from "../components/PollListing";
  import BottomButtons from "../components/BottomButtons";
  import BlackHeader from "../components/BlackHeader";
  import CriticalErrorOverlay from "../components/CriticalErrorOverlay";
  import BigNumber from 'bignumber.js';

  export default {
    name: 'Home',
    components: {BlackHeader, BottomButtons, PollListing, BiggerLoader, CriticalErrorOverlay},
    data() {
      return {
        error: null,
        showLoading: true,
        address: null,
        balance: null,
        activeTab: null,
        availableTabs: ["hot", "closing", "stake", "new", "closed"],
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
          y: null
        }
      };
    },
    watch: {
      '$route.query.tab'() {
        this.activeTab = this.$route.query.tab;
        this.showLoading = true;
        this.updateTabView();
        this.showLoading = false;
      }
    },
    props: ["resetView"],
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
          this.error = `Could not find poll with id "${id}".`
      },
      switchTab(newTab) {
        if (this.activeTab !== newTab) this.$router.push({query: {tab: newTab}});
      },
      updateTabView() {
        this.resetView();

        switch (this.activeTab) {
          case "hot":
            this.polls = this.activePolls.filter(([id, _]) => this.pollOrdering.ordering.includes(id)).sort((a, b) => {
              return this.pollOrdering.ordering.indexOf(a[0]) - this.pollOrdering.ordering.indexOf(b[0])
            });
            break;
          case "stake":
            // eslint-disable-next-line no-case-declarations
            const stakeOrdering = this.pollOrdering.data.sort((a, b) => {
              return new BigNumber(b.totalStake).comparedTo(a.totalStake);
            }).map(poll => poll.id);
            this.polls = this.activePolls.sort((a, b) => {
              return stakeOrdering.indexOf(a[0]) - stakeOrdering.indexOf(b[0]);
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
        // Reset filter
        this.updateTabView();

        // ONLY NUMBERS?
        if (/^\d+$/.test(searchString)) this.polls = this.polls.filter(poll => poll[0] === parseInt(searchString));
        else this.polls = this.polls.filter(poll => poll[1].title.indexOf(searchString) > -1);
      },
      touchStartEvent(event) {
        this.startPosition = {x: event.touches[0].clientX, y: event.touches[0].clientY};
      },
      touchEndEvent(event) {
        const diff = {
          x: event.changedTouches[event.changedTouches.length - 1].clientX - this.startPosition.x,
          y: event.changedTouches[event.changedTouches.length - 1].clientY - this.startPosition.y
        };
        if (Math.abs(diff.x) > Math.abs(diff.y) && Math.abs(diff.x) > 100) {
          this.swipeTab(diff.x);
        }
        this.startPosition = {x: null, y: null};
      },
      swipeTab(diffX) {
        const currentIndex = this.availableTabs.indexOf(this.activeTab);
        let direction = diffX > 0 ? -1 : 1;
        if (currentIndex + direction < 0) direction = 4;
        this.switchTab(this.availableTabs[(currentIndex + direction) % this.availableTabs.length]);
      },
    },

    async mounted() {
      if (aeternity.isTestnet() && aeternity.balance <= 5) {
        await fetch(`https://testnet.faucet.aepps.com/account/${aeternity.address}`,
          {
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            method: 'POST'
          }).catch(console.error);
      }

      this.address = aeternity.address;
      this.balance = aeternity.balance;

      const fetchPolls = aeternity.polls().catch(e => {
        console.error(e);
        this.error = 'Could not fetch polls.'
      });
      const fetchOrdering = new Backend(aeternity.networkId).pollOrdering(false).catch(console.error);

      const [allPolls, pollOrdering] = await Promise.all([fetchPolls, fetchOrdering]);
      this.pollOrdering = pollOrdering;
      this.allPolls = allPolls.filter(([_, data]) => data.title.length <= 50);

      if(this.allPolls) {
        this.closedPolls = this.allPolls.filter(([_, data]) => data.is_listed).filter(poll => typeof poll[1].close_height === 'number' && poll[1].close_height <= aeternity.height);
        this.activePolls = this.allPolls.filter(([_, data]) => data.is_listed).filter(poll => typeof poll[1].close_height !== 'number' || poll[1].close_height > aeternity.height);
      }

      // Only overwrite if active tab is not set yet
      if (!this.activeTab) this.activeTab = this.pollOrdering ? 'hot' : 'new';
      // Fallback if poll order fetching fails
      if ((this.activeTab === 'stake' || this.activeTab === 'hot') && !this.pollOrdering) this.activeTab = 'new';
      // Update available tabs if there is no backend
      if (!this.pollOrdering) this.availableTabs = ["closing", "new", "closed"];

      this.updateTabView();

      document.addEventListener('touchstart', this.touchStartEvent, false);
      document.addEventListener('touchend', this.touchEndEvent, false);

      this.showLoading = false;

    },
    created() {
      this.activeTab = this.$route.query.tab ? this.$route.query.tab : null;
    },
    beforeDestroy() {
      document.removeEventListener('touchstart', this.touchStartEvent, false);
      document.removeEventListener('touchend', this.touchEndEvent, false);
    }
  };
</script>

<style lang="scss" scoped>
  .tab-switcher {
    display: flex;
    background-color: #272831;
    color: #727278;
    font-weight: 400;
    padding: 15px 15px 0 15px;

    &:hover {
      cursor: pointer;
    }
  }

  .tab {
    font-size: 16px;
    font-weight: 600;
    padding-bottom: 15px;
    border-bottom: 2px solid #272831;
    margin: 0 15px;

    &:last-child {
      margin-right: 0;
    }

    &:first-child {
      margin-left: 0;
    }
  }

  .tab.active {
    color: #67F7B8;
    border-bottom: 2px solid #67F7B8;
  }

  .poll-list {
    margin-top: 76px;
    padding: 0 15px;
  }

  @media only screen
  and (min-device-width: 320px)
  and (max-device-width: 480px)
  and (-webkit-min-device-pixel-ratio: 2) {
    .tab {
      font-size: 15px;
      margin: 0 10px;
      padding-bottom: 10px;
    }

    .tab-switcher {
      padding: 10px 10px 0 10px;
    }

    .poll-list {
      padding: 0 10px;
      margin-top: 66px;
    }
  }
</style>
