<template>
  <div class="w-8 h-8">
    <div class="rounded-full w-full h-full flex justify-center items-center shadow bg-gray-ae"
         @click="action">
      <img :src="img" alt="generic_alt" class="w-8 h-8">
    </div>
  </div>
</template>

<script>
  export default {
    name: "SmallButton",
    props: ['img', 'action']
  }
</script>

<style scoped>
 .bg-gray-ae {
   background-color: #929CA6;
 }
</style>
