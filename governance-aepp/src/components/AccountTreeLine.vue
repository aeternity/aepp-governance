<template>
  <div>
    <div class="flex justify-between">
      <ae-identity-light
        :collapsed="true"
        :address="account"
        balance=""
        class="mx-2"
        @click="$router.push(`/account/${account}`)"
      />
      <div @click="showSubTree = !showSubTree">
      <span v-if="totalTreeDepth">
        (<span class="text-primary">{{totalTreeDepth}}D</span>)
      </span>
        <span>
        {{totalBalance | toAE}}
      </span>
      </div>
    </div>
    <div class="ml-2 my-1">
      <AccountTreeLine :account="directDelegator.account" :balance="directDelegator.balance"
                       :delegators="directDelegator.delegations"
                       v-for="directDelegator in directDelegators" :key="directDelegator.account"
                       v-if="showSubTree"></AccountTreeLine>
    </div>
  </div>
</template>

<script>
  import AeIdentityLight from '../components/AeIdentityLight'
  import BigNumber from 'bignumber.js'

  export default {
    name: "AccountTreeLine",
    components: {AeIdentityLight},
    props: ['balance', 'account', 'delegators', 'noSum'],
    data() {
      return {
        directDelegators: [],
        showSubTree: false,
        totalTreeDepth: null,
        totalBalance: null
      }
    },
    methods: {
      obtainTotalNumberOfDelegations(tree) {
        let treeArray = Object.keys(tree);
        if (!treeArray.length) return 0;
        return treeArray.reduce(
          (acc, accountAddress) => this.obtainTotalNumberOfDelegations(tree[accountAddress].delegations) + acc
          , treeArray.length);
      },
      obtainTotalBalanceFromDelegations(account) {
        let treeArray = Object.keys(account.delegations);
        if (!treeArray.length) return account.balance;
        return treeArray.reduce(
          (acc, accountAddress) => BigNumber(this.obtainTotalBalanceFromDelegations(account.delegations[accountAddress])).plus(acc)
          , account.balance);
      }
    },
    created() {
      this.directDelegators = Object.keys(this.delegators).map(account => {
        return {
          ...{account}, ...this.delegators[account]
        }
      });
      this.totalTreeDepth = this.obtainTotalNumberOfDelegations(this.delegators);
      this.totalBalance = this.noSum ? this.balance : this.obtainTotalBalanceFromDelegations({delegations: this.delegators, balance: this.balance});
    }
  }
</script>

<style scoped>

</style>
