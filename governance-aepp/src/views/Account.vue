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

    <div class="flex flex-col mx-2 mt-2" v-if="address && balance">
      <div class="bg-white rounded-t p-2 shadow">
        <div>
          <div class="label mb-2">
            Account
          </div>
          <ae-identity-light
            :collapsed="true"
            :balance="balance.toFixed(2)"
            :address="address"
            :active="true"
          />
          <hr class="border-t border-gray-200"/>
          <div class="label text-xs mb-1">est. delegated stake {{delegateStake}} AE</div>
          <div class="-mb-1">est. voting stake <strong>{{totalStake}} AE</strong></div>
        </div>
      </div>
      <div class="bg-gray-300 rounded-b  p-2 cursor-pointer flex justify-center">
        <a href="https://forum.aeternity.com/" target="_blank" class="label text-sm">NEED ASSISTANCE?</a>
      </div>
    </div>
    <br/>
    <div v-if="delegation">
      <h2 class="h2">Delegatee</h2>
      <ae-identity-light
        :collapsed="true"
        :balance="''"
        :currency="''"
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
          :balance="delegatorAmount.toFixed(2)"
          :address="delegator"
          class="mx-4"
        />
        <div v-if="includesIndirectDelegations" class="mx-4 mb-1 text-xs">(includes more indirect delegations)</div>
      </div>
    </div>
    <div v-if="authorOfPolls.length">
      <h2 class="h2">Poll Author</h2>
      <div v-for="[id, data] in authorOfPolls">
        <a @click="$router.push(`/poll/${id}`)">#{{id}} {{data.title}} ({{data.votes_count}} votes)</a>
        <br/>
      </div>
    </div>  <div v-if="votedInPolls.length">
      <h2 class="h2">Voted in Polls</h2>
      <div v-for="[id, data] in votedInPolls">
        <a @click="$router.push(`/poll/${id}`)">#{{id}} {{data.title}}</a>
        <br/>
      </div>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon, AeButton, AeButtonGroup, AeInput, AeText} from '@aeternity/aepp-components/'
    import BlockchainUtil from "~/utils/util";
    import axios from 'axios'
    import BiggerLoader from '../components/BiggerLoader'
    import AeIdentityLight from '../components/AeIdentityLight'
    import BigNumber from 'bignumber.js';

    export default {
        name: 'Home',
        components: {AeIcon, AeButton, AeButtonGroup, AeInput, BiggerLoader, AeIdentityLight, AeText},
        data() {
            return {
                showLoading: true,
                address: null,
                balance: null,
                power: null,
                delegatee: "",
                isOwnAccount: false,
                delegation: null,
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
            async loadData() {
                this.showLoading = true;
                this.delegatee = null;
                this.delegations = [];
                this.delegation = null;
                this.delegateStake = null;
                this.totalStake = null;
                this.address = this.$route.params.account;
                this.isOwnAccount = this.address === aeternity.address;

                const balance = await aeternity.client.balance(this.address);
                this.balance = BlockchainUtil.atomsToAe(balance);


                this.votedInPolls = (await aeternity.contract.methods.polls_by_voter(this.address)).decodedResult;
                this.authorOfPolls = (await aeternity.contract.methods.polls_by_author(this.address)).decodedResult;

                console.log(this.votedInPolls, this.authorOfPolls);

                this.delegation = (await aeternity.contract.methods.delegatee(this.address)).decodedResult;

                const delegationsResult = await aeternity.contract.methods.delegators(this.address);
                this.delegations = await Promise.all(delegationsResult.decodedResult.map(async ([delegator, delegatee]) => {
                    const delegateeDelegations = (await aeternity.contract.methods.delegators(delegator)).decodedResult;
                    return {
                        delegator: delegator,
                        delegatee: delegatee,
                        delegatorAmount: BlockchainUtil.atomsToAe(await aeternity.client.balance(delegator)),
                        includesIndirectDelegations: delegateeDelegations.length !== 0
                    }
                }));

                const delegatedPower = await axios.get(`http://localhost:3000/delegatedPower/${this.address}`).then(res => res.data);
                this.delegateStake = BlockchainUtil.atomsToAe(delegatedPower.delegatedPower).toFixed(2);
                this.totalStake = BlockchainUtil.atomsToAe(new BigNumber(balance).plus(delegatedPower.delegatedPower)).toFixed(2);
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
