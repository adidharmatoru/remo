<template>
  <footer class="bg-header border-t border-header-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-high-contrast font-semibold mb-4">Product</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink
                to="/features"
                class="text-default hover:text-high-contrast"
                >Features</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/download"
                class="text-default hover:text-high-contrast"
                >Download</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/pricing"
                class="text-default hover:text-high-contrast"
                >Pricing</NuxtLink
              >
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-high-contrast font-semibold mb-4">Resources</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/docs" class="text-default hover:text-high-contrast"
                >Documentation</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/guides"
                class="text-default hover:text-high-contrast"
                >Guides</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/api" class="text-default hover:text-high-contrast"
                >API</NuxtLink
              >
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-high-contrast font-semibold mb-4">Company</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink
                to="/about"
                class="text-default hover:text-high-contrast"
                >About</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/blog" class="text-default hover:text-high-contrast"
                >Blog</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/contact"
                class="text-default hover:text-high-contrast"
                >Contact</NuxtLink
              >
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-high-contrast font-semibold mb-4">Legal</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink
                to="/privacy"
                class="text-default hover:text-high-contrast"
                >Privacy</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/terms"
                class="text-default hover:text-high-contrast"
                >Terms</NuxtLink
              >
            </li>
          </ul>
        </div>
      </div> -->

      <!-- <div
        class="mt-8 pt-8 border-t border-header-border text-center text-default"
      > -->
      <div class="text-center text-default">
        <!-- GitHub Logo -->
        <div class="mb-4 flex justify-center">
          <a
            href="https://github.com/adidharmatoru/remo"
            target="_blank"
            class="text-default hover:text-high-contrast"
            aria-label="Github Repository"
          >
            <svg
              class="h-8 w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clip-rule="evenodd"
              />
            </svg>
          </a>
        </div>
        <p>&copy; {{ new Date().getFullYear() }} Remo. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
