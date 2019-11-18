<template>
  <div class="flex justify-end items-center absolute w-full" :style="{top: top + 'px'}">
    <div class="mr-2">
      <slot/>
      {{coordinates}}
    </div>
    <div class="border border-gray-500 w-16"></div>
  </div>

</template>

<script>
  export default {
    name: "ExplainerItem",
    props: {
      target: {
        required: true,
        type: String
      }
    },
    data() {
      return {
        interval: null,
        top: 0
      }
    },
    computed: {
      coordinates() {
        return document.querySelector(this.target) ? document.querySelector(this.target).getBoundingClientRect() : null
      }
    },
    methods: {
      getCoordinates() {
        const element = document.querySelector(this.target);
        return element ? element.getBoundingClientRect() : null
      },
      updateElementPosition() {
        const coordinates = this.getCoordinates();
        this.top = coordinates.top;
      }
    },
    mounted() {
      this.interval = setInterval(() => {
        if (this.getCoordinates()) {
          clearInterval(this.interval);
          this.updateElementPosition();
        }
      }, 500)
    },
    beforeDestroy() {
      clearInterval(this.interval)
    }
  }
</script>

<style scoped>

</style>
