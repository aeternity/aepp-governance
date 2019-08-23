<template>
  <div class="mb-2">
    <div>
      <a @click="$router.push(`/poll/${id}`)">#{{id}} {{data.title}}</a>
      <span v-if="voteCount != null">({{voteCount}} votes)</span>
      <ae-loader v-if="voteCount == null && loading"/>
    </div>
    <div>
      <span v-if="percentOfTotalSupply">{{percentOfTotalSupply | formatPercent}} stake - </span>
      <span>{{closeHeight(data.close_height)}}</span>
    </div>
  </div>
</template>

<script>
  import {AeLoader} from '@aeternity/aepp-components/'
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
