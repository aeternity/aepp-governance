<template>
  <div>
    <div class="overlay-loader" v-show="showLoading && !error">
      <BiggerLoader></BiggerLoader>
    </div>
    <div v-if="address">
      <AccountHeader :address="address"/>
    </div>
    <div v-if="delegation">
      <div class="mx-4 mt-4">Delegatee</div>
      <div class="ae-card mx-4 my-2 py-4 px-3 flex justify-between">
        <ae-identity-light
          :collapsed="true"
          :balance="''"
          :address="delegation"
        />
        <div v-if="isOwnAccount" class="flex ml-auto">
          <img src="../assets/edit.svg" class="pr-4" @click="() => { delegatee = delegation; delegation = null}">
          <div class="h-full border-r border-gray-500 opacity-50"></div>
          <img src="../assets/delete.svg" class="pl-4 pr-1" @click="revokeDelegation">
        </div>
      </div>
    </div>
    <div v-if="!delegation && isOwnAccount">
      <div class="mx-4 mt-4">Delegate your voting power</div>
      <div class="flex bg-white mx-4 my-2">
        <ae-input label="Delegatee" v-model="delegatee" aeddress></ae-input>
        <div class="ml-auto border-r border-gray-500 opacity-50 my-2"></div>
        <img src="../assets/back_gray.svg" class="px-4 rotate-180" @click="createDelegation">
      </div>
    </div>
    <div class="flex w-full text-center text-gray-500 mt-4 text-sm">
      <div class="flex-1 pb-2 border-b-2 border-gray-300" @click="switchTab('delegations')"
           :class="{'active-tab': tab === 'delegations'}">DELEGATIONS
      </div>
      <div class="flex-1 pb-2 border-b-2 border-gray-300" @click="switchTab('votes')"
           :class="{'active-tab': tab === 'votes'}">VOTES
      </div>
      <div class="flex-1 pb-2 border-b-2 border-gray-300" @click="switchTab('polls')"
           :class="{'active-tab': tab === 'polls'}">POLLS
      </div>
    </div>
    <div v-if="tab === 'votes'">
      <div v-if="votedInPolls.length" class="mt-1">
        <div class="my-2" v-for="[id, data] in votedInPolls">
          <!-- TODO add voted option -->
          <PollListing :id="id" :data="data" class="mx-4"/>
        </div>
      </div>
      <div v-else class="text-gray-500 text-xl text-center my-8">
        Could not find any votes.
      </div>
    </div>
    <div v-if="tab === 'delegations'">
      <div v-if="delegations.length">
        <div v-for="{delegator, _, delegatorAmount, includesIndirectDelegations} in delegations"
             class="ae-card py-4 mx-4 my-2">
          <ae-identity-light
            :collapsed="true"
            :balance="delegatorAmount"
            :address="delegator"
            class="mx-4"
          />
          <div v-if="includesIndirectDelegations" class="mx-4 mt-1 text-xs">(includes more indirect delegations)</div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-xl text-center my-8">
        Could not find any delegations to you.
      </div>
    </div>
    <div v-if="tab === 'polls'">
      <div v-if="authorOfPolls.length" class="mt-1">
        <div class="my-2" v-for="[id, data] in authorOfPolls">
          <PollListing :id="id" :data="data" class="mx-4"/>
        </div>
      </div>
      <div v-else class="text-gray-500 text-xl text-center my-8">
        Could not find any polls you created.
      </div>
    </div>
    <BottomButtons></BottomButtons>
    <CriticalErrorOverlay :error="error" @continue="error = null"></CriticalErrorOverlay>
  </div>
</template>

<script>
  import aeternity from "~/utils/aeternity";
  import {AeIcon, AeButton, AeButtonGroup, AeText} from '@aeternity/aepp-components/src/components/'
  import BiggerLoader from '../components/BiggerLoader'
  import AeIdentityLight from '../components/AeIdentityLight'
  import BigNumber from 'bignumber.js';
  import Backend from "~/utils/backend";
  import PollListing from "~/components/PollListing";
  import BottomButtons from "~/components/BottomButtons";
  import AccountHeader from "~/components/AccountHeader";
  import CriticalErrorOverlay from "~/components/CriticalErrorOverlay";
  import AeInput from '~/components/ae-input'

  export default {
    name: 'Home',
    components: {
      CriticalErrorOverlay,
      AccountHeader,
      BottomButtons,
      AeIcon, AeButton, AeButtonGroup, AeInput, BiggerLoader, AeIdentityLight, AeText, PollListing
    },
    data() {
      return {
        showLoading: true,
        address: null,
        balance: null,
        power: null,
        delegatee: "",
        isOwnAccount: false,
        delegation: null,
        delegatedPower: null,
        tab: null,
        delegations: [],
        votedInPolls: [],
        authorOfPolls: [],
        error: null
      }
    },
    computed: {},
    beforeRouteUpdate(to, from, next) {
      next();
      if(this.address !== this.$route.params.account) this.loadData();
      else this.tab = this.$route.query.tab ? this.$route.query.tab : 'delegations'
    },
    methods: {
      switchTab(newTab) {
        if(this.tab !== newTab) this.$router.push({query: {tab: newTab}})
      },
      async createDelegation() {
        if (this.delegatee.includes('ak_')) {
          this.showLoading = true;
          try {
            await aeternity.contract.methods.delegate(this.delegatee);
            await Backend.contractEvent("Delegation").catch(console.error);
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
          await Backend.contractEvent("RevokeDelegation").catch(console.error);
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

        this.balance = await aeternity.client.balance(this.address);
        this.delegation = await aeternity.delegation(this.address);
        this.delegations = await aeternity.delegations(this.address);

        await Backend.delegatedPower(this.address).then(delegatedPower => {
          this.delegatedPower = delegatedPower.delegatedPower;
          this.totalStake = new BigNumber(this.balance).plus(this.delegatedPower);
        }).catch(console.error);

        await Backend.accountPollVoterAuthor(this.address).then(data => {
          this.votedInPolls = data.votedInPolls.sort((a, b) => b[0] - a[0]);
          this.authorOfPolls = data.authorOfPolls.sort((a, b) => b[0] - a[0]);
        }).catch(console.error);

        this.showLoading = false;
      }
    },
    async mounted() {
      this.loadData();
      this.tab = this.$route.query.tab ? this.$route.query.tab : "delegations";
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

</style>
