<template>
  <div class="fixed inset-0 flex items-center justify-center bg-overlay p-6 z-40" v-show="error">
  <div class="bg-black-100 max-w-desktop text-white p-5 rounded">
      <div class="w-full">
        <h1 class="font-bold pt-4 text-3xl text-center text-primary">Ooops!</h1>
        <p class="text-base pt-4 text-center">
          {{error}}
        </p>
        <div class="flex justify-center mt-6">
          <ae-button fill="primary" face="round" @click="ctaClick">{{errorCTA}}</ae-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

  import "@aeternity/aepp-components/dist/ae-button/ae-button.css"
  import AeButton from "@aeternity/aepp-components/dist/ae-button/"

  export default {
    name: 'CriticalErrorOverlay',
    components: { AeButton },
    props:  {
      error: {
        type: String,
        default: null
      },
      errorCTA: {
        type: String,
        default: "Okay"
      }
    },
    methods: {
      ctaClick () {
        this.$emit('continue')
      }
    }
  }
</script>

<style scoped type="text/scss">
  @import '../theme/ae-button.scss';

  .bg-overlay {
    background-color: #12121bbb;
  }
</style>
