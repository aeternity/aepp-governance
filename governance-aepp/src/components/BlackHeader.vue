<template>
    <div class="bg-gray-ae px-6 py-4 w-full text-3xl text-white">
      <slot />
    </div>
</template>

<script>
    export default {
        name: "BlackHeader"
    }
</script>

<style scoped>
  .bg-gray-ae {
    background-color: #333333;
    text-transform: capitalize;
  }
</style>
