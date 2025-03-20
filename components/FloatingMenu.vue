<template>
  <Transition name="fade">
    <div
      v-if="isMounted"
      id="floating-menu-anchor"
      ref="anchorEl"
      :style="[anchorStyle, vars]"
      :class="{
        'floating-menu-vertical': isVertical,
        'floating-menu-hide': isMinimized
      }"
      @mousemove="bringUp"
    >
      <div
        class="floating-menu-glowing"
        :style="isDragging ? 'opacity: 0.6 !important' : ''"
      />
      <div
        ref="panelEl"
        class="floating-menu-panel"
        :style="panelStyle"
        @pointerdown="onPointerDown"
      >
        <button
          class="floating-menu-icon-button floating-menu-main-button"
          :title="title"
          @click="$emit('toggle')"
        >
          <Icon name="fluent:remote-16-filled" />
        </button>
        <div class="floating-menu-divider" />
        <div
          class="floating-menu-content floating-menu-label"
          :title="labelTitle"
        >
          <div class="floating-menu-label-main" :class="latencyColorClass">
            {{ primaryLabel }}
          </div>
          <span class="floating-menu-label-secondary">{{
            secondaryLabel
          }}</span>
        </div>

        <div class="floating-menu-divider" />
        <div
          class="floating-menu-content floating-menu-label"
          title="Frame rate"
        >
          <div class="floating-menu-label-main">
            {{ tertiaryLabel.split(' ')[0] }}
          </div>
          <span class="floating-menu-label-secondary">FPS</span>
        </div>

        <div class="floating-menu-divider" />
        <div class="color-mode-wrapper">
          <ColorModePicker
            @color-mode-change="handleColorModeChange"
            title="Theme Select"
          />
        </div>
        <slot name="additional-menus"></slot>
      </div>
    </div>
  </Transition>
</template>

<script>
import { computed, reactive, ref, onMounted } from 'vue';
import ColorModePicker from './ColorModePicker.vue';

export default {
  name: 'FloatingMenu',
  components: {
    ColorModePicker
  },
  props: {
    title: {
      type: String,
      default: 'Menu'
    },
    labelTitle: {
      type: String,
      default: 'Latency'
    },
    actionTitle: {
      type: String,
      default: 'Menu Action'
    },
    primaryLabel: {
      type: String,
      default: '0'
    },
    secondaryLabel: {
      type: String,
      default: 'ms'
    },
    minimizeDelay: {
      type: Number,
      default: 3000
    },
    tertiaryLabel: {
      type: String,
      default: '0 FPS'
    }
  },

  setup(props) {
    const isMounted = ref(false);
    const showSubmenu = ref(false);
    const state = reactive({
      open: false,
      position: 'right',
      left: 100,
      top: 50,
      minimizePanelInactive: props.minimizeDelay
    });

    // Add computed property for latency color class
    const latencyColorClass = computed(() => {
      const latency = parseInt(props.primaryLabel, 10);
      if (isNaN(latency)) return '';

      if (latency < 100) return 'latency-good';
      if (latency < 180) return 'latency-medium';
      return 'latency-bad';
    });

    /*global useColorMode*/
    const vars = computed(() => ({
      '--floating-menu-bg':
        useColorMode().value === 'light' ? '#111' : '#ffffff',
      '--floating-menu-fg':
        useColorMode().value === 'light' ? '#F5F5F5' : '#111',
      '--floating-menu-border':
        useColorMode().value === 'light' ? '#3336' : '#efefef',
      '--floating-menu-shadow':
        useColorMode().value === 'light'
          ? 'rgba(0,0,0,0.3)'
          : 'rgba(128,128,128,0.1)'
    }));

    const windowSize = reactive({ width: 0, height: 0 });
    const isDragging = ref(false);
    const isHovering = ref(false);
    const draggingOffset = reactive({ x: 0, y: 0 });
    const mousePosition = reactive({ x: 0, y: 0 });
    const anchorEl = ref(null);
    const panelEl = ref(null);

    const SNAP_THRESHOLD = 2;
    const panelMargins = reactive({
      left: 10,
      top: 10,
      right: 10,
      bottom: 10
    });

    function snapToPoints(value) {
      if (value < 5) return 0;
      if (value > 95) return 100;
      if (Math.abs(value - 50) < SNAP_THRESHOLD) return 50;
      return value;
    }

    function onPointerDown(e) {
      if (!panelEl.value) return;
      isDragging.value = true;
      const { left, top, width, height } =
        panelEl.value.getBoundingClientRect();
      draggingOffset.x = e.clientX - left - width / 2;
      draggingOffset.y = e.clientY - top - height / 2;
    }

    function toggleSubmenu() {
      showSubmenu.value = !showSubmenu.value;
    }

    const submenuPosition = computed(() => {
      switch (state.position) {
        case 'top':
          return 'submenu-bottom';
        case 'bottom':
          return 'submenu-top';
        case 'left':
          return 'submenu-right';
        case 'right':
          return 'submenu-left';
        default:
          return 'submenu-bottom';
      }
    });

    const submenuStyle = computed(() => {
      if (!showSubmenu.value) return {};

      const panelRect = panelEl.value?.getBoundingClientRect();
      if (!panelRect) return {};

      const style = {};

      switch (state.position) {
        case 'top':
          style.bottom = '100%';
          style.left = '50%';
          style.transform = 'translateX(-50%) translateY(-8px)';
          break;
        case 'bottom':
          style.top = '100%';
          style.left = '50%';
          style.transform = 'translateX(-50%) translateY(8px)';
          break;
        case 'left':
          style.right = '100%';
          style.top = '50%';
          style.transform = 'translateY(-50%) translateX(-8px)';
          break;
        case 'right':
          style.left = '100%';
          style.top = '50%';
          style.transform = 'translateY(-50%) translateX(8px)';
          break;
      }

      return style;
    });

    onMounted(() => {
      /*global nextTick*/
      nextTick(() => {
        isMounted.value = true;
      });

      windowSize.width = window.innerWidth;
      windowSize.height = window.innerHeight;

      window.addEventListener('resize', () => {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
      });

      // Update click outside listener to use isMounted
      document.addEventListener('click', (e) => {
        if (!isMounted.value) return;
        const submenuEl = document.querySelector('.submenu');
        const actionButton = document.querySelector('.floating-menu-content');
        if (
          submenuEl &&
          !submenuEl.contains(e.target) &&
          !actionButton.contains(e.target)
        ) {
          showSubmenu.value = false;
        }
      });

      window.addEventListener('pointermove', (e) => {
        if (!isDragging.value) return;

        const centerX = windowSize.width / 2;
        const centerY = windowSize.height / 2;

        const x = e.clientX - draggingOffset.x;
        const y = e.clientY - draggingOffset.y;

        mousePosition.x = x;
        mousePosition.y = y;

        const deg = Math.atan2(y - centerY, x - centerX);
        const HORIZONTAL_MARGIN = 70;
        const TL = Math.atan2(0 - centerY + HORIZONTAL_MARGIN, 0 - centerX);
        const TR = Math.atan2(
          0 - centerY + HORIZONTAL_MARGIN,
          windowSize.width - centerX
        );
        const BL = Math.atan2(
          windowSize.height - HORIZONTAL_MARGIN - centerY,
          0 - centerX
        );
        const BR = Math.atan2(
          windowSize.height - HORIZONTAL_MARGIN - centerY,
          windowSize.width - centerX
        );

        state.position =
          deg >= TL && deg <= TR
            ? 'top'
            : deg >= TR && deg <= BR
              ? 'right'
              : deg >= BR && deg <= BL
                ? 'bottom'
                : 'left';

        state.left = snapToPoints((x / windowSize.width) * 100);
        state.top = snapToPoints((y / windowSize.height) * 100);
      });

      window.addEventListener('pointerup', () => {
        isDragging.value = false;
      });
      window.addEventListener('pointerleave', () => {
        isDragging.value = false;
      });

      // Close submenu when clicking outside
      document.addEventListener('click', (e) => {
        const submenuEl = document.querySelector('.submenu');
        const actionButton = document.querySelector('.floating-menu-content');
        if (
          submenuEl &&
          !submenuEl.contains(e.target) &&
          !actionButton.contains(e.target)
        ) {
          showSubmenu.value = false;
        }
      });
    });

    const isVertical = computed(
      () => state.position === 'left' || state.position === 'right'
    );

    const anchorPos = computed(() => {
      const halfWidth = (panelEl.value?.clientWidth || 0) / 2;
      const halfHeight = (panelEl.value?.clientHeight || 0) / 2;

      const left = (state.left * windowSize.width) / 100;
      const top = (state.top * windowSize.height) / 100;

      switch (state.position) {
        case 'top':
          return {
            left: Math.min(
              Math.max(left, halfWidth + panelMargins.left),
              windowSize.width - halfWidth - panelMargins.right
            ),
            top: panelMargins.top + halfHeight
          };
        case 'right':
          return {
            left: windowSize.width - panelMargins.right - halfHeight,
            top: Math.min(
              Math.max(top, halfWidth + panelMargins.top),
              windowSize.height - halfWidth - panelMargins.bottom
            )
          };
        case 'left':
          return {
            left: panelMargins.left + halfHeight,
            top: Math.min(
              Math.max(top, halfWidth + panelMargins.top),
              windowSize.height - halfWidth - panelMargins.bottom
            )
          };
        case 'bottom':
        default:
          return {
            left: Math.min(
              Math.max(left, halfWidth + panelMargins.left),
              windowSize.width - halfWidth - panelMargins.right
            ),
            top: windowSize.height - panelMargins.bottom - halfHeight
          };
      }
    });

    let _timer = null;
    function bringUp() {
      isHovering.value = true;
      if (state.minimizePanelInactive < 0) return;
      if (_timer) clearTimeout(_timer);
      _timer = setTimeout(() => {
        isHovering.value = false;
      }, state.minimizePanelInactive);
    }

    const isMinimized = computed(() => {
      if (state.minimizePanelInactive < 0) return false;
      if (state.minimizePanelInactive === 0) return true;
      return (
        !isDragging.value &&
        !state.open &&
        !isHovering.value &&
        state.minimizePanelInactive
      );
    });

    const anchorStyle = computed(() => ({
      left: `${anchorPos.value.left}px`,
      top: `${anchorPos.value.top}px`
    }));

    const panelStyle = computed(() => {
      const style = {
        transform: isVertical.value
          ? `translate(${isMinimized.value ? `calc(-50% ${state.position === 'right' ? '+' : '-'} 15px)` : '-50%'}, -50%) rotate(90deg)`
          : `translate(-50%, ${isMinimized.value ? `calc(-50% ${state.position === 'top' ? '-' : '+'} 15px)` : '-50%'})`
      };

      if (isMinimized.value) {
        switch (state.position) {
          case 'top':
          case 'right':
            style.borderTopLeftRadius = '0';
            style.borderTopRightRadius = '0';
            break;
          case 'bottom':
          case 'left':
            style.borderBottomLeftRadius = '0';
            style.borderBottomRightRadius = '0';
            break;
        }
      }

      if (isDragging.value) style.transition = 'none !important';

      return style;
    });

    return {
      isMounted,
      anchorEl,
      panelEl,
      vars,
      isDragging,
      isVertical,
      isMinimized,
      showSubmenu,
      submenuPosition,
      submenuStyle,
      anchorStyle,
      panelStyle,
      onPointerDown,
      toggleSubmenu,
      bringUp,
      latencyColorClass
    };
  }
};
</script>

<style>
#floating-menu-anchor {
  width: 0;
  z-index: 2147483645;
  position: fixed;
  transform-origin: center center;
  transform: translate(-50%, -50%) rotate(0);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 15px !important;
  box-sizing: border-box;
}

#floating-menu-anchor * {
  box-sizing: border-box;
}

.floating-menu-panel {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: flex-start;
  overflow: hidden;
  align-items: center;
  gap: 2px;
  height: 30px;
  padding: 2px 2px 2px 2.5px;
  border: 1px solid var(--floating-menu-border);
  border-radius: 100px;
  background-color: var(--floating-menu-bg);
  backdrop-filter: blur(10px);
  color: var(--floating-menu-fg);
  box-shadow: 2px 2px 8px var(--floating-menu-shadow);
  user-select: none;
  touch-action: none;
  /* width: auto; Allow width to be dynamic based on content */
  max-width: 1080px; /* Remove max-width to ensure it fits content */
  transition: all 0.6s ease;
  display: flex;
  align-items: center;
}

.floating-menu-vertical .floating-menu-panel {
  transform: translate(-50%, -50%) rotate(90deg);
}

.floating-menu-hide .floating-menu-panel {
  max-width: 32px;
  padding: 8px;
}

.floating-menu-divider {
  border-left: 1px solid #8883;
  width: 1px;
  height: 10px;
}

.floating-menu-content {
  transition: opacity 0.4s ease;
}

.floating-menu-hide .floating-menu-content {
  opacity: 0;
}

.floating-menu-hide .floating-menu-divider {
  display: none;
}

.floating-menu-label {
  padding: 0 7px 0 8px;
  font-size: 0.8em;
  line-height: 1em;
  display: flex;
  gap: 3px;
  justify-items: center;
  align-items: center;
}

.floating-menu-vertical .floating-menu-label {
  transform: rotate(-90deg);
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
}

.floating-menu-vertical .iconify {
  transform: rotate(-90deg);
}

.floating-menu-label-main {
  opacity: 0.8;
}

.floating-menu-label-secondary {
  font-size: 0.8em;
  line-height: 0.6em;
  opacity: 0.5;
}

.floating-menu-icon-button {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  color: inherit;
  border-radius: 100%;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
}

.floating-menu-icon-button:hover {
  opacity: 1;
}

.floating-menu-glowing {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  opacity: 0;
  transition: all 1s ease;
  pointer-events: none;
  z-index: -1;
  border-radius: 9999px;
  background-image: linear-gradient(45deg, #00dc82, #00dc82, #00dc82);
  filter: blur(60px);
}

#floating-menu-anchor:hover .floating-menu-glowing {
  opacity: 0.6;
}

@media print {
  #floating-menu-anchor {
    display: none;
  }
}

.submenu-enter-active,
.submenu-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: scale(0.95) !important;
}

.submenu {
  position: absolute;
  background-color: var(--floating-menu-bg);
  border: 1px solid var(--floating-menu-border);
  border-radius: 8px;
  box-shadow: 2px 2px 8px var(--floating-menu-shadow);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2147483646;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.menu-item:hover {
  opacity: 1;
}

.menu-item.text-primary-500 {
  opacity: 1;
}

.submenu-item {
  background: none;
  border: none;
  color: var(--floating-menu-fg);
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: var(--floating-menu-border);
}

.action-menu-wrapper {
  position: relative;
}

.color-mode-wrapper {
  display: flex;
  align-items: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Add latency color styling */
.latency-good {
  color: #8fd9a8 !important;
  font-weight: 600;
}

.latency-medium {
  color: #e6c787 !important;
  font-weight: 600;
}

.latency-bad {
  color: #e6a0a0 !important;
  font-weight: 600;
}
</style>
