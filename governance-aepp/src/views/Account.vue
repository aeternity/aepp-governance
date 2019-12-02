<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader/>
    </div>
    <div v-if="address" id="account-summary">
      <AccountHeader :address="address" :canOpen="false"/>
    </div>
    <div v-if="delegation">
      <div class="mx-4 mt-4">Delegatee</div>
      <div class="ae-card mx-4 my-2 py-4 px-3 flex justify-between" id="account-delegatee">
        <ae-identity-light
          :collapsed="true"
          :balance="''"
          @click="$router.push(`/account/${delegation}`)"
          :address="delegation"
        />
        <div v-if="isOwnAccount" class="flex ml-auto">
          <img src="../assets/edit.svg" class="pr-4"
               @click="() => { delegatee = delegation; delegation = null}"
               alt="edit">
          <div class="h-full border-r border-gray-500 opacity-50"></div>
          <img src="../assets/delete.svg" class="pl-4 pr-1" @click="revokeDelegation" alt="delete">
        </div>
      </div>
    </div>
    <div v-if="!delegation && isOwnAccount">
      <div class="mx-4 mt-4">Delegate your voting power</div>
      <div class="flex bg-white mx-4 my-2">
        <ae-input label="Delegatee" v-model="delegatee" aeddress/>
        <div class="ml-auto border-r border-gray-500 opacity-50 my-2"></div>
        <img src="../assets/back_gray.svg" class="px-4 rotate-180" @click="createDelegation" alt="back">
      </div>
    </div>
    <div class="flex w-full text-center text-gray-500 mt-4 text-sm">
      <div class="flex-1 pb-2 border-b-2 border-gray-300 cursor-pointer" @click="switchTab('delegations')"
           :class="{'active-tab': activeTab === 'delegations'}">DELEGATIONS
      </div>
      <div class="flex-1 pb-2 border-b-2 border-gray-300 cursor-pointer" @click="switchTab('votes')"
           :class="{'active-tab': activeTab === 'votes'}">VOTES
      </div>
      <div class="flex-1 pb-2 border-b-2 border-gray-300 cursor-pointer" @click="switchTab('polls')"
           :class="{'active-tab': activeTab === 'polls'}">POLLS
      </div>
    </div>

    <div v-if="activeTab === 'delegations'" id="account-tab-delegations">
      <div v-if="delegations.length">
        <div v-for="{delegator, delegatorAmount, includesIndirectDelegations} in delegations"
             :key="delegator" class="ae-card py-4 mx-4 my-2">
          <ae-identity-light
            :collapsed="true"
            :balance="delegatorAmount"
            :address="delegator"
            @click="$router.push(`/account/${delegator}`)"
            class="mx-4"
          />
          <div v-if="includesIndirectDelegations" class="mx-4 mt-1 text-xs">(includes more indirect delegations)</div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-xl text-center my-8">
        Could not find any delegations to {{isOwnAccount ? 'you' : 'this account'}}.
      </div>
    </div>
    <div v-if="activeTab === 'votes'" id="account-tab-votes">
      <div v-if="votedInPolls.length" class="mt-1">
        <div class="my-2" v-for="[id, data] in votedInPolls" :key="id">
          <PollListing :id="id" :data="data" :showVote="true" class="mx-4"/>
        </div>
      </div>
      <div v-else class="text-gray-500 text-xl text-center my-8">
        Could not find any votes.
      </div>
    </div>
    <div v-if="activeTab === 'polls'" id="account-tab-polls">
      <div v-if="authorOfPolls.length" class="mt-1">
        <div class="my-2" v-for="[id, data] in authorOfPolls" :key="id">
          <PollListing :id="id" :data="data" class="mx-4"/>
        </div>
      </div>
      <div v-else class="text-gray-500 text-xl text-center py-4 my-4">
        Could not find any polls created by {{isOwnAccount ? 'you' : 'this account'}}.
      </div>
    </div>
    <BottomButtons htmlId="account-nav-buttons" :search-bar="true" :search-button="true" @searchSubmit="handleSearch"
                   :key="`bottomButtons${address}`"/>
    <div class="fixed flex bottom-36 px-8 w-full" v-if="searchError">
      <div class="flex-1 rounded-full bg-gray-500 text-white px-4 py-2 ae-error-field">
        {{searchError}}
      </div>
    </div>
    <CriticalErrorOverlay :error="error" @continue="error = null"/>
  </div>
</template>

<script>
  import aeternity from "../utils/aeternity";
  import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto';
  import BiggerLoader from '../components/BiggerLoader'
  import AeIdentityLight from '../components/AeIdentityLight'
  import BigNumber from 'bignumber.js';
  import Backend from "../utils/backend";
  import PollListing from "../components/PollListing";
  import BottomButtons from "../components/BottomButtons";
  import AccountHeader from "../components/AccountHeader";
  import CriticalErrorOverlay from "../components/CriticalErrorOverlay";
  import AeInput from '../components/AeInput'

  export default {
    name: 'Home',
    components: {
      CriticalErrorOverlay,
      AccountHeader,
      BottomButtons,
      AeInput, BiggerLoader, AeIdentityLight, PollListing
    },
    data() {
      return {
        showLoading: true,
        address: "",
        balance: null,
        power: null,
        delegatee: "",
        isOwnAccount: false,
        delegation: null,
        delegatedPower: null,
        activeTab: null,
        delegations: [],
        votedInPolls: [],
        authorOfPolls: [],
        error: null,
        searchError: null,
        availableTabs: ["delegations", "votes", "polls"]
      }
    },
    computed: {},
    beforeRouteUpdate(to, from, next) {
      next();
      if (this.address !== this.$route.params.account) this.loadData();
      else this.activeTab = this.$route.query.tab ? this.$route.query.tab : 'delegations'
    },
    methods: {
      handleSearch(searchText) {
        this.searchError = '';
        if (!searchText) return this.searchError = 'Please enter an address';
        if (Crypto.isAddressValid(searchText)) {
          this.$router.push(`/account/${searchText}`)
        } else {
          this.searchError = 'The address is not valid'
        }
      },
      switchTab(newTab) {
        if (this.activeTab !== newTab) this.$router.push({query: {tab: newTab}})
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
      async createDelegation() {
        if (this.delegatee.includes('ak_')) {
          this.showLoading = true;
          try {
            await aeternity.contract.methods.delegate(this.delegatee);
            await new Backend(aeternity.networkId).contractEvent("Delegation").catch(console.error);
            await this.loadData();
          } catch (e) {
            console.error(e);
            this.showLoading = false;
            this.error = 'Could not create your delegation. Please try again.';

          }
        }
      },
      async revokeDelegation() {
        this.showLoading = true;
        try {
          await aeternity.contract.methods.revoke_delegation();
          await new Backend(aeternity.networkId).contractEvent("RevokeDelegation").catch(console.error);
          await this.loadData();
        } catch (e) {
          console.error(e);
          this.showLoading = false;
          this.error = 'Could not revoke your delegation. Please try again.'
        }

      },
      resetData() {
        this.showLoading = true;
        this.delegatee = null;
        this.delegations = [];
        this.votedInPolls = [];
        this.authorOfPolls = [];
        this.delegation = null;
        this.totalStake = null;
      },
      async loadData() {
        this.resetData();

        this.address = this.$route.params.account;
        this.isOwnAccount = this.address === aeternity.address;

        const fetchBalance = aeternity.client.balance(this.address).catch(() => '0').then(balance => {
          this.balance = balance
        });
        const fetchDelegation = aeternity.delegation(this.address).catch(e => {
          console.error(e);
          this.error = 'Could not fetch delegation.'
        });
        const fetchDelegations = aeternity.delegations(this.address).catch(e => {
          console.error(e);
          this.error = 'Could not fetch delegations.'
        });


        const fetchDelegatedPower = new Backend(aeternity.networkId).delegatedPower(this.address).then(async delegatedPower => {
          await fetchBalance;
          if (delegatedPower === null) return;
          this.delegatedPower = delegatedPower.delegatedPower;
          this.totalStake = new BigNumber(this.balance).plus(this.delegatedPower);
        }).catch(console.error);

        const fetchAccountPollVoterAuthor = new Backend(aeternity.networkId).accountPollVoterAuthor(this.address).then(data => {
          if (data === null) return;
          this.votedInPolls = data.votedInPolls.filter(poll => poll[1].is_listed);
          this.votedInPolls = this.votedInPolls.concat(data.delegateeVotes.filter(poll => {
            return poll[1].is_listed && !data.votedInPolls.some(vote => vote[0] === poll[0])
          })); //
          this.votedInPolls = this.votedInPolls.sort((a, b) => b[0] - a[0]);
          this.authorOfPolls = data.authorOfPolls.filter(poll => poll[1].is_listed).sort((a, b) => b[0] - a[0]);
        }).catch(console.error);

        const [delegation, delegations] = await Promise.all([fetchDelegation, fetchDelegations, fetchBalance, fetchDelegatedPower, fetchAccountPollVoterAuthor]);
        this.delegation = delegation;
        this.delegations = delegations;

        this.showLoading = false;
      }
    },
    async mounted() {
      await this.loadData();
      this.activeTab = this.$route.query.tab ? this.$route.query.tab : "delegations";
      document.addEventListener('touchstart', this.touchStartEvent, false);
      document.addEventListener('touchend', this.touchEndEvent, false);
    },
    beforeDestroy() {
      document.removeEventListener('touchstart', this.touchStartEvent, false);
      document.removeEventListener('touchend', this.touchEndEvent, false);
    }
  }
</script>

<style scoped>

  .rotate-180 {
    transform: rotate(180deg);
  }

  .active-tab {
    border-color: #FF0D6A;
    color: black;
  }

  .bottom-36 {
    bottom: 9rem;
  }

  .ae-error-field {
    border-color: #ff0d0d;
    background-color: #ff0d0d;
  }

</style>
