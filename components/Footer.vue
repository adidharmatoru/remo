<template>
  <footer class="bg-header border-t border-header-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center text-default">
        <!-- GitHub Logo -->
        <div class="mb-4 flex justify-center">
          <a
            href="https://github.com/adidharmatoru/remo"
            target="_blank"
            class="text-default hover:text-high-contrast"
            aria-label="Github Repository"
          >
            <Icon name="mdi:github" class="mr-2 h-8 w-8" />
          </a>
        </div>
        <p>&copy; {{ new Date().getFullYear() }} Remo. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
