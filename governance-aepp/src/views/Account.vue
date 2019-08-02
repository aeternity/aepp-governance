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
    <div v-if="address && balance">
      <span>{{address}}</span>
      <br/>
      <span>Stake: {{balance}} AE</span>
      <br/>
      <span>est. delegated Power: {{power}} AE</span>
    </div>
    <br/>
    <span v-if="delegation">
      <h2 class="h2">Delegated to: </h2>
      <router-link :to="`/account/${delegation}`">{{delegation}}</router-link>
    </span>
    <div v-if="isOwnAccount">
      <ae-input label="Delegatee" v-model="delegatee" aeddress>
      </ae-input>
      <div class="revokation-buttons">
        <ae-button face="round" extend @click="revokeDelegation()" v-if="delegation">Revoke</ae-button>
        <ae-button face="round" fill="primary" extend @click="createDelegation()" v-if="delegation">Update</ae-button>
        <ae-button face="round" fill="primary" extend @click="createDelegation()" v-else>Create</ae-button>
      </div>
    </div>
    <br v-else/>
    <br/>
    <div v-if="delegations.length">
      <h2 class="h2">Delegations</h2>
      <div v-for="{delegator, _, delegatorAmount, includesIndirectDelegations} in delegations">
        <router-link :to="`/account/${delegator}`">{{delegator}}</router-link>
        for {{delegatorAmount}} AE <span v-if="includesIndirectDelegations">(includes more indirect delegations)</span>
        <br/>
        <br/>
      </div>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternity";
    import {AeIcon, AeButton, AeInput} from '@aeternity/aepp-components/'
    import BlockchainUtil from "~/utils/util";
    import axios from 'axios'
    import BiggerLoader from '../components/BiggerLoader'

    export default {
        name: 'Home',
        components: {AeIcon, AeButton, AeInput, BiggerLoader},
        data() {
            return {
                showLoading: true,
                address: null,
                balance: null,
                power: null,
                delegatee: "",
                isOwnAccount: false,
                delegation: null,
                delegations: []
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
                this.power = null;
                this.address = this.$route.params.account;
                this.isOwnAccount = this.address === aeternity.address;

                this.balance = BlockchainUtil.atomsToAe(await aeternity.client.balance(this.address));

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
                this.power = BlockchainUtil.atomsToAe(delegatedPower.delegatedPower);
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
  }
</style>
