<template>
  <div class="ae-card p-4 flex" @click="$router.push(`/poll/${id}`)">
    <div>
      <div class="h-6 flex items-center vote-id">
        <img class="h-full" src="../assets/hash.svg"/>
        <span class="text-primary text-2xl leading-none mr-2">{{id}}</span>
        <span class="text-2xl leading-none">{{data.title}}</span>
      </div>
      <div v-if="vote">

      </div>
      <div class="text-gray-500 text-sm">
        <span v-if="percentOfTotalSupply">{{percentOfTotalSupply | formatPercent}} stake - </span>
        <span v-else-if="loading"><ae-loader></ae-loader> stake - </span>
        <span>{{closeHeight(data.close_height)}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import {AeLoader} from '@aeternity/aepp-components/src/components/'
  import Backend from "~/utils/backend";

  export default {
    components: {AeLoader},
    data() {
      return {
        loading: true,
        percentOfTotalSupply: null,
        voteCount: null,
      }
    },
    props: {
      id: {
        type: Number
      },
      data: {
        type: Object
      },
      vote: {
        type: Number,
        default: null
      }
    },
    methods: {
      closeHeight(close_height) {
        if (!close_height) return "never closes";
        return `closes at ${close_height}`
      }
    },
    mounted() {
      Backend.pollOverview(this.data.poll).then(overview => {
        this.percentOfTotalSupply = overview.percentOfTotalSupply;
        this.voteCount = overview.voteCount;
        this.loading = false
      }).catch(() => {
        this.loading = false
      });
    }
  }
</script>

<style scoped>
  .toaster {
    color: white;
    background: rgba(0, 0, 0, 0.8)
  }
</style>
