<template>
  <header class="bg-header border-b border-header-border">
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
    >
      <div class="flex items-center">
        <NuxtLink to="/" class="text-high-contrast font-semibold text-lg">
          <Logo />
        </NuxtLink>
        <nav class="hidden md:flex ml-8 space-x-4">
          <NuxtLink
            to="/devices"
            class="text-default hover:text-high-contrast px-3 py-2"
            :class="{ 'text-high-contrast': $route.path === '/devices' }"
            active-class="text-high-contrast"
          >
            Devices
          </NuxtLink>
          <NuxtLink
            to="/credits"
            class="text-default hover:text-high-contrast px-3 py-2"
            :class="{ 'text-high-contrast': $route.path === '/credits' }"
            active-class="text-high-contrast"
          >
            Credits & Roadmap
          </NuxtLink>
        </nav>
      </div>
      <button @click="toggleMenu" class="md:hidden flex items-center p-2">
        <svg
          class="w-6 h-6 text-high-contrast"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16m-7 6h7"
          ></path>
        </svg>
      </button>
    </div>
    <div v-if="isMenuOpen" class="md:hidden">
      <nav class="flex flex-col space-y-2 mt-2">
        <NuxtLink
          to="/devices"
          class="text-default hover:text-high-contrast px-3 py-2"
          :class="{ 'text-high-contrast': $route.path === '/devices' }"
          active-class="text-high-contrast"
        >
          Devices
        </NuxtLink>
        <NuxtLink
          to="/credits"
          class="text-default hover:text-high-contrast px-3 py-2"
          :class="{ 'text-high-contrast': $route.path === '/credits' }"
          active-class="text-high-contrast"
        >
          Credits & Roadmap
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script>
export default {
  data() {
    return {
      isMenuOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    }
  }
};
</script>

<style scoped></style>
