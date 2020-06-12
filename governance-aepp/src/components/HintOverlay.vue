<template>
  <div class="fixed flex inset-0 z-30 bg-transparent-80 justify-center items-center" v-if="!hide && top !== null" @click.stop.prevent="removeOverlay">
      <img src="../assets/help.svg" alt="help" class="rounded-full flex items-center cursor-pointer absolute shadow-white"
           :style="{'top': top + 'px', 'left': left + 'px'}" @click="$router.push('/help')">
    <div class="text-white text-2xl p-4">
      Tap the question mark to learn more (or anywhere to close).
    </div>
  </div>
</template>

<script>
  export default {
    name: "HintOverlay",
    data() {
      return {
        interval: null,
        top: null,
        left: null,
        hide: false
      }
    },
    methods: {
      getCoordinates() {
        const element = document.querySelector('#question-mark-icon');
        return element && window.getComputedStyle(element).display !== 'none' ? element.getBoundingClientRect() : null;
      },
      updateElementPosition() {
        const coordinates = this.getCoordinates();
        this.top = coordinates !== null ? coordinates.top : null;
        this.left = coordinates !== null ? coordinates.left : null;
      },
      removeOverlay() {
        localStorage.setItem('intro-completed', 'true');
        this.hide = true;
      }
    },
    mounted() {
      if(localStorage.getItem('intro-completed')) this.hide = true;
      this.interval = setInterval(() => {
        if (this.getCoordinates()) {
          clearInterval(this.interval);
          this.updateElementPosition();
        }
      }, 500);
      window.addEventListener('resize', this.updateElementPosition, false);

    },
    beforeDestroy() {
      clearInterval(this.interval);
      window.removeEventListener('resize', this.updateElementPosition, false);
    }
  }
</script>

<style scoped>
  .bg-transparent-80 {
    background-color: rgba(30,30,30,.8);
  }
  .shadow-white {
    box-shadow: 0 0 30px 15px #fff;
  }
</style>
