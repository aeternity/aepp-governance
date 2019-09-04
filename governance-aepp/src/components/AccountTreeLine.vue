<template>
  <div>
    <div class="flex justify-between">
      <ae-identity-light
        :collapsed="true"
        :address="account"
        balance=""
        class="mx-2"
      />
      <div @click="showSubTree = !showSubTree">
      <span v-if="totalTreeDepth">
        (<span class="text-primary">{{totalTreeDepth}}D</span>)
      </span>
        <span>
        {{balance | toAE}}
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

  export default {
    name: "AccountTreeLine",
    components: {AeIdentityLight},
    props: ['balance', 'account', 'delegators'],
    data() {
      return {
        directDelegators: [],
        showSubTree: false,
        totalTreeDepth: null
      }
    },
    methods: {
      obtainTotalNumberOfDelegations(tree) {
        let treeArray = Object.keys(tree);
        if (!treeArray.length) return 0;
        return treeArray.reduce(
          (acc, accountAddress) => this.obtainTotalNumberOfDelegations(tree[accountAddress].delegations) + acc
          , treeArray.length);
      }
    },
    created() {
      this.directDelegators = Object.keys(this.delegators).map(account => {
        return {
          ...{account}, ...this.delegators[account]
        }
      });
      this.totalTreeDepth = this.obtainTotalNumberOfDelegations(this.delegators)
    }
  }
</script>

<style scoped>

</style>
