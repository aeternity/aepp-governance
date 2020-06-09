<template>
  <div class="w-8 h-8">
    <div class="rounded-full w-full h-full flex justify-center items-center shadow bg-gray-ae cursor-pointer"
         @click="$emit('click')">
      <img :src="img" alt="generic_alt" class="w-8 h-8">
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
 .bg-gray-ae {
   background-color: #272831;
 }
</style>
