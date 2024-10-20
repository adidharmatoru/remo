<script setup>
function iconName(theme) {
  if (theme === 'light') return 'i-ph-sun';
  if (theme === 'dark') return 'i-ph-moon';
}
</script>

<template>
  <button
    class="color-mode-picker"
    @click="
      $colorMode.preference = $colorMode.value === 'light' ? 'dark' : 'light'
    "
  >
    <Icon :name="iconName($colorMode.value)" class="icon" />
  </button>
</template>

<style scoped>
.color-mode-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-alternate);
  cursor: pointer;
  transition: background-color 0.3s;
}

.icon {
  width: 18px;
  height: 18px;
  color: var(--color-default);
  transition: color 0.3s;
}

.color-mode-picker:hover {
  background-color: var(--color-hover);
}

.color-mode-picker:hover .icon {
  color: var(--color-high-contrast);
}
</style>
