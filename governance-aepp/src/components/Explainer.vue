<template>
  <div class="hidden md:flex cursor-pointer " v-if="activeView.items.length > 0 || activeView.headline" @click="toggleView">
    <div class="h-full flex justify-center items-center px-2 text-gray-600 shadow-left hover:shadow-xl" >
      <img src="../assets/back_gray.svg" :class="{'rotate-180': showHints}">
    </div>
    <div class="relative show-hints ae-transition-300" :class="{'hide-hints': !showHints}">
      <h1 class="text-2xl mr-8 mb-0 leading-tight mt-1">Helps and Hints</h1>
      <h2 class="text-xl mt-0 leading-none italic">{{activeView.headline}}</h2>
      <ExplainerItem v-for="item in activeView.items" :target="item.target" :offset="item.offset" :key="item.target">
        {{item.text}}
      </ExplainerItem>
    </div>
  </div>
</template>

<script>
  import ExplainerItem from "./ExplainerItem";
  import help from '~/assets/help.json'

  export default {
    name: "Explainer",
    components: {ExplainerItem},
    data() {
      return {
        showHints: true,
        activeView: {
          headline: '',
          items: [],
        },
        views: help
      }
    },
    watch: {
      showHints() {
        localStorage.setItem('showHints', String(this.showHints))
      }
    },
    methods: {
      setActiveView(name) {
        this.activeView = this.views.hasOwnProperty(name) ? this.views[name] : {
          headline: '',
          items: []
        };
      },
      toggleView() {
        this.showHints = !this.showHints
      }
    },
    mounted() {
      this.setActiveView(this.$route.name);
      this.$router.afterEach((to) => {
        this.setActiveView(to.name)
      });
      // true as default, otherwise compare strings
      this.showHints = localStorage.getItem('showHints') === null ? true : localStorage.getItem('showHints') === 'true'
    }
  }
</script>

<style scoped>
  .show-hints {
    min-width: 300px;
    max-width: 500px;
    overflow: hidden;
    margin-left: 1rem;
    z-index: 0;
    opacity: 1;
  }

  .hide-hints {
    max-width: 0;
    min-width: 0;
    opacity: 0;
    margin-left: 0;
  }

  .shadow-left {
    box-shadow: -2px 0 3px 0 rgba(0, 0, 0, 0.15);
  }
</style>
