<template>
  <div>
    <div class="overlay-loader" v-show="showLoading">
      <BiggerLoader></BiggerLoader>
    </div>
    <div @click="$router.push('/')" class="fixed top-0 right-0 p-8">
      <ae-icon name="close" fill="primary" face="round"
               class="ae-icon-size shadow"></ae-icon>
    </div>

    <h1 class="h1">Account</h1>
    <br/>

    <div class="flex flex-col mx-2 mt-2" v-if="address">
      <div class="bg-white rounded p-2 shadow">
        <div>
          <div class="label mb-2">
            Account
          </div>
          <ae-identity-light
            :collapsed="true"
            :balance="balance"
            :address="address"
          />
          <div v-if="totalStake!= null && delegatedPower != null">
            <hr class="border-t border-gray-200"/>
            <div class="label text-xs">est. delegated stake {{delegatedPower | toAE}}</div>
            <div class="label text-xs mb-1">(delegators votes can overwrite delegation)</div>
            <div class="-mb-1">est. voting stake <strong>{{totalStake | toAE}}</strong></div>
          </div>
          <span v-else class="label text-xs">can't load complete delegation information, may include more delegated stake than listed below</span>
        </div>
      </div>
    </div>
    <br/>
    <div v-if="delegation">
      <h2 class="h2">Delegatee</h2>
      <ae-identity-light
        :collapsed="true"
        :balance="''"
        :address="delegation"
        class="mx-4 mb-2"
      />
    </div>
    <div v-if="isOwnAccount">
      <ae-input class=" mx-2 mt-2" label="Delegatee" v-model="delegatee" aeddress></ae-input>
      <div class="revokation-buttons">
        <ae-button-group v-if="delegation" class="w-full">
          <ae-button face="flat" @click="revokeDelegation()">Revoke</ae-button>
          <ae-button face="flat" fill="primary" @click="createDelegation()">Update</ae-button>
        </ae-button-group>
        <ae-button face="flat" extend fill="primary" @click="createDelegation()" v-else>Create</ae-button>
      </div>
    </div>
    <div v-if="delegations.length">
      <h2 class="h2">Delegations</h2>
      <div v-for="{delegator, _, delegatorAmount, includesIndirectDelegations} in delegations" class="max-w-xs">
        <ae-identity-light
          :collapsed="true"
          :balance="delegatorAmount"
          :address="delegator"
          class="mx-4"
        />
        <div v-if="includesIndirectDelegations" class="mx-4 mb-1 text-xs">(includes more indirect delegations)</div>
      </div>
    </div>
    <div v-if="authorOfPolls.length" class="mt-1">
      <h2 class="h2">Poll Author</h2>
      <div v-for="[id, data] in authorOfPolls">
        <PollListing :id="id" :data="data"/>
      </div>
    </div>
    <div v-if="votedInPolls.length" class="mt-1">
      <h2 class="h2">Voted in Polls</h2>
      <div v-for="[id, data] in votedInPolls">
        <PollListing :id="id" :data="data"/>
      </div>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon, AeButton, AeButtonGroup, AeInput, AeText} from '@aeternity/aepp-components/'
    import BiggerLoader from '../components/BiggerLoader'
    import AeIdentityLight from '../components/AeIdentityLight'
    import BigNumber from 'bignumber.js';
    import Backend from "~/utils/backend";
    import PollListing from "~/components/PollListing";

    export default {
        name: 'Home',
        components: {AeIcon, AeButton, AeButtonGroup, AeInput, BiggerLoader, AeIdentityLight, AeText, PollListing},
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
                delegations: [],
                votedInPolls: [],
                authorOfPolls: []
            }
        },
        computed: {},
        beforeRouteUpdate(to, from, next) {
            next();
            this.loadData();
        },
        methods: {
            async createDelegation() {
                if (this.delegatee.includes('ak_')) {
                    this.showLoading = true;
                    await aeternity.contract.methods.delegate(this.delegatee);
                    await this.loadData();
                }
            },
            async revokeDelegation() {
                this.showLoading = true;
                await aeternity.contract.methods.revoke_delegation();
                await this.loadData();
            },
            resetData() {
                this.showLoading = true;
                this.delegatee = null;
                this.delegations = [];
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
                    this.votedInPolls = data.votedInPolls;
                    this.authorOfPolls = data.authorOfPolls;
                }).catch(console.error);


                this.showLoading = false;
            }
        },
        async mounted() {
            this.loadData();
        }
    }
</script>

<style scoped>
  .revokation-buttons {
    display: flex;
    margin-top: -8px;
  }

  .ae-input-container {
    width: inherit;
  }
</style>
