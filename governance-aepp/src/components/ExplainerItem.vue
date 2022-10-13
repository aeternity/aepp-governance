<template>
  <div class="absolute w-full" :style="{top: top + 'px'}">
    <div v-if="top !== null" class="flex justify-end items-start content-start text-gray-600" >
      <div class="mr-2">
        <slot/>
      </div>
      <div class="border border-primary w-16 mt-3"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ExplainerItem",
    props: {
      target: {
        required: true,
        type: String
      },
      offset: {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        interval: null,
        observer: null,
        top: null
      }
    },
    methods: {
      getCoordinates() {
        const element = document.querySelector(this.target);
        return element && window.getComputedStyle(element).display !== 'none' ? element.getBoundingClientRect() : null;
      },
      updateElementPosition() {
        const coordinates = this.getCoordinates();
        if(coordinates === null) this.top = null;
        else this.top = coordinates.top + this.offset;
      }
    },
    mounted() {
      this.interval = setInterval(() => {
        if (this.getCoordinates()) {
          clearInterval(this.interval);
          this.updateElementPosition();
          this.observer = new MutationObserver(this.updateElementPosition);
          this.observer.observe(document.querySelector(this.target).parentElement, {  childList: true });
        }
      }, 500);
      window.addEventListener('resize', this.updateElementPosition, false);

    },
    beforeUnmount() {
      clearInterval(this.interval);
      window.removeEventListener('resize', this.updateElementPosition, false);
      if(this.observer) this.observer.disconnect();
    }
  }
</script>

<style scoped>

</style>
