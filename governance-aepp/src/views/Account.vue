<template>
  <div>
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
    </div>
    <br/>
    <span v-if="delegation">
    Delegated to: <router-link :to="`/account/${delegation}`">{{delegation}}</router-link>
    </span>
    <div v-if="isOwnAccount">
      <ae-input label="Delegatee" v-model="delegatee" aeddress>
      </ae-input>
      <ae-button face="round" fill="primary" extend @click="createDelegation()">Create Delegation</ae-button>
    </div>
    <br/>
    <div v-if="delegations.length">
      Delegations
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

    export default {
        name: 'Home',
        components: {AeIcon, AeButton, AeInput},
        data() {
            return {
                address: null,
                balance: null,
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
                    await aeternity.contract.methods.delegate(this.delegatee);
                    await this.loadData();
                    this.delegatee = null;
                }
            },
            async loadData() {
                this.delegations = [];
                this.delegation = null;
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
            }
        },
        async mounted() {
            this.loadData();
        }
    }
</script>

<style scoped>

</style>
