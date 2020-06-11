<template>
  <div class="w-6 h-6">
    <div class="w-full h-full flex justify-center items-center cursor-pointer"
         @click="$emit('click')">
      <img :src="img" alt="generic_alt" class="w-6 h-6">
    </div>
  </div>
</template>

<script>
  export default {
    name: "SmallButton",
    props: ['img']
  }
</script>

<style scoped>
</style>
