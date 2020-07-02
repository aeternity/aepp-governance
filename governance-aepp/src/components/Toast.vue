<template>
  <div class="toaster text-white rounded py-2 px-4">
    <slot/>
  </div>
</template>

<script>
  export default {
    name: 'Toast'
  }
</script>

<style scoped>
  .toaster {
    background: rgba(0, 0, 0, 0.8)
  }
</style>
