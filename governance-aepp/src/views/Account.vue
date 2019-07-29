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
    Delegated to: {{delegation.delegatee}}
    </span>
    <div>
      <ae-input label="Delegatee" v-model="delegatee" aeddress>
      </ae-input>
      <ae-button face="round" fill="primary" extend @click="createDelegation()">Create Delegation</ae-button>
    </div>
    <br/>
    <div>
      Delegations
      <span v-for="{delegator, _, delegatorAmount} in delegations">
        {{delegator}} for {{delegatorAmount}} AE
      </span>
    </div>
  </div>
</template>

<script>
    import aeternity from "~/utils/aeternityNetwork";
    import {AeIcon, AeButton, AeInput} from '@aeternity/aepp-components/'
    import BlockchainUtil from "~/utils/blockchainUtil";

    export default {
        name: 'Home',
        components: {AeIcon, AeButton, AeInput},
        data() {
            return {
                address: null,
                balance: null,
                delegation: null,
                delegatee: "",
                delegations: []
            }
        },
        computed: {},
        methods: {
            async createDelegation() {
                if (this.delegatee.includes('ak_')) {
                    await aeternity.contract.methods.delegate(this.delegatee);
                    await this.loadData();
                    this.delegatee = null;
                }
            },
            async loadData() {
                this.address = aeternity.address;
                this.balance = aeternity.balance;
                const delegationsResult = await aeternity.contract.methods.delegations(this.address)
                const allDelegations = await Promise.all(delegationsResult.decodedResult.map(async ([delegator, delegatee]) => {
                    return {
                        delegator: delegator,
                        delegatee: delegatee,
                        delegatorAmount: BlockchainUtil.atomsToAe(await aeternity.client.balance(delegator))
                    }
                }));

                this.delegation = allDelegations.find(delegation => delegation.delegator === this.address);
                this.delegations = allDelegations.filter(delegation => delegation.delegatee === this.address);
            }
        },
        async mounted() {
            this.loadData();
        }
    }
</script>

<style scoped>

</style>
