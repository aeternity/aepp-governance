<template>
  <div class="ae-card p-4 pb-2" @click="$router.push(`/poll/${id}`)">
    <div class="flex items-center vote-id w-full">
      <img class="h-6" src="../assets/hash.svg"/>
      <span class="text-primary text-2xl leading-none mr-2">{{id}}</span>
      <span class="text-2xl leading-none break-words max-w-85">{{data.title}}</span>
    </div>
    <div class="text-gray-500 text-sm">
      <span v-if="percentOfTotalSupply">{{percentOfTotalSupply | formatPercent(2)}} stake - </span>
      <span v-else-if="loading"><ae-loader></ae-loader> stake - </span>
      <span>{{closeHeight(data.close_height)}}{{timeDifference(data.close_height) | timeDifferenceToString}}</span>
    </div>
  </div>
</template>

<script>
  import {AeLoader} from '@aeternity/aepp-components/src/components/';
  import Backend from "~/utils/backend";
  import aeternity from "~/utils/aeternity";

  export default {
    components: {AeLoader},
    data() {
      return {
        loading: true,
        percentOfTotalSupply: null,
        voteCount: null,
      };
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
        if (typeof close_height !== "number") return "never closes";
        if (close_height < aeternity.height) return `closed at block ${close_height}`;
        return `closes in `;
      },
      timeDifference(close_height) {
        if (typeof close_height !== "number" || close_height < aeternity.height) return "";
        return (close_height - aeternity.height) * 3 * 60 * 1000;
      }
    },
    mounted() {
      Backend.pollOverview(this.data.poll).then(overview => {
        this.percentOfTotalSupply = overview.percentOfTotalSupply;
        this.voteCount = overview.voteCount;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    }
  };
</script>

<style scoped>
  .toaster {
    color: white;
    background: rgba(0, 0, 0, 0.8)
  }
</style>
