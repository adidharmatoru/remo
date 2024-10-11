<script setup>
function iconName(theme) {
  if (theme === 'light') return 'i-ph-sun';
  if (theme === 'dark') return 'i-ph-moon';
}
</script>

<template>
  <div
    class="toggle-container"
    @click="
      $colorMode.preference = $colorMode.value === 'light' ? 'dark' : 'light'
    "
  >
    <div class="toggle">
      <div
        class="toggle-switch"
        :class="{
          light: $colorMode.value === 'light',
          dark: $colorMode.value === 'dark'
        }"
      >
        <Icon :name="iconName($colorMode.value)" class="icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toggle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer; /* Make the whole container clickable */
}

.toggle {
  width: 60px;
  height: 30px;
  border-radius: 15px;
  background-color: var(--color-alternate); /* Change to alternate background */
  position: relative;
  transition: background-color 0.3s;
}

.toggle-switch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(
    --color-alternate
  ); /* Use white for the switch for contrast */
  position: absolute;
  top: 0;
  transition: transform 0.3s;
}

.toggle-switch.light {
  transform: translateX(30px);
}

.icon {
  width: 15px;
  height: 15px;
  position: absolute;
  top: 7.5px;
  left: 7.5px;
  transition: opacity 0.3s;
}

.status {
  margin-top: 10px;
  text-align: center;
}
</style>
