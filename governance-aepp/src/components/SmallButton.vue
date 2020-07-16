<template>
  <div class="w-6 h-6">
    <div class="w-full h-full flex justify-center items-center cursor-pointer"
         @click="$emit('click')">
      <img 
        @mouseover="hover = true"
        @mouseleave="hover = false"
        :src="hover && hoverImg ? hoverImg : img" alt="generic_alt" class="w-6 h-6"
      >
    </div>
  </div>
</template>

<script>
  export default {
    name: "SmallButton",
    props: ['img', 'hoverImg'],
    data() {
      return {
        hover: false,
      };
    }
  }
</script>

<style scoped>
</style>
