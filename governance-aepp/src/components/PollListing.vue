<template>
  <div class="ae-card p-4 pb-2 cursor-pointer" @click="$router.push(`/poll/${id}`)">
    <div class="flex items-center vote-id w-full">
      <img class="h-6" src="../assets/hash.svg" alt="hash"/>
      <span class="text-primary text-2xl leading-none mr-2">{{id}}</span>
      <span class="text-2xl leading-none break-words max-w-85">{{data.title}}</span>
    </div>
    <div v-if="showVote" class="mt-1 -ml-1">
      <ae-check :checked="true" class="pointer-events-none"><span class="pl-1">{{data.vote}}</span></ae-check>
    </div>
    <div class="text-gray-500 text-sm mt-1">
      <span v-if="percentOfTotalSupply">{{percentOfTotalSupply | formatPercent(2)}} stake - </span>
      <span v-else-if="loading"><ae-loader></ae-loader> stake - </span>
      <span v-if="isClosed">closed at {{data.close_height}} (~{{Math.abs(timeDifference) | timeDifferenceToString}} ago)</span>
      <span v-else-if="typeof data.close_height !== 'number'">never closes</span>
      <span v-else>closes in {{timeDifference | timeDifferenceToString}}</span>
    </div>
  </div>
</template>

<script>
  import {AeLoader, AeCheck} from '@aeternity/aepp-components/src/components/';
  import Backend from "~/utils/backend";
  import aeternity from "~/utils/aeternity";

  export default {
    components: {AeLoader, AeCheck},
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
      showVote: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      isClosed() {
        return this.data.close_height < aeternity.height
      },
      timeDifference() {
        return (this.data.close_height - aeternity.height) * 3 * 60 * 1000;
      }
    },
    mounted() {
      Backend.pollOverview(this.data.poll).then(overview => {
        if(overview !== null) {
          this.percentOfTotalSupply = overview.percentOfTotalSupply;
          this.voteCount = overview.voteCount;
        }
        this.loading = false;
      }).catch(e => {
        console.error(e);
        this.loading = false;
      });
    }
  };
</script>

<style scoped>

</style>
