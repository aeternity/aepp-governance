<template>
    <div class="grey-bg p-6 w-full text-3xl text-white">
      <slot />
    </div>
</template>

<script>
    export default {
        name: "BlackHeader"
    }
</script>

<style scoped>
  .grey-bg {
    background-color: #333333;
  }
</style>
