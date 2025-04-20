<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'title'
  },
  description: {
    type: String,
    default: 'description'
  },
  headline: {
    type: String,
    default: 'headline'
  },
  colorMode: {
    type: String,
    default: 'dark',
    validator: (value) => ['light', 'dark'].includes(value)
  }
});

const title = computed(() => (props.title || '').slice(0, 60));
const description = computed(() => (props.description || '').slice(0, 200));

const bgColor = computed(() =>
  props.colorMode === 'light' ? '#f8fafc' : '#020420'
);
const textColor = computed(() =>
  props.colorMode === 'light' ? '#020420' : '#ffffff'
);
const subTextColor = computed(() =>
  props.colorMode === 'light' ? '#334155' : '#E4E4E7'
);
const accentColor = computed(() => '#00DC82'); // Using the original green theme color
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <svg
      class="absolute right-0 top-0"
      width="629"
      height="593"
      viewBox="0 0 629 593"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      :style="{ opacity: colorMode === 'light' ? '0.4' : '1' }"
    >
      <g filter="url(#filter0_f_199_94966)">
        <path
          d="M628.5 -578L639.334 -94.4223L806.598 -548.281L659.827 -87.387L965.396 -462.344L676.925 -74.0787L1087.69 -329.501L688.776 -55.9396L1160.22 -164.149L694.095 -34.9354L1175.13 15.7948L692.306 -13.3422L1130.8 190.83L683.602 6.50012L1032.04 341.989L668.927 22.4412L889.557 452.891L649.872 32.7537L718.78 511.519L628.5 36.32L538.22 511.519L607.128 32.7537L367.443 452.891L588.073 22.4412L224.955 341.989L573.398 6.50012L126.198 190.83L564.694 -13.3422L81.8734 15.7948L562.905 -34.9354L96.7839 -164.149L568.224 -55.9396L169.314 -329.501L580.075 -74.0787L291.604 -462.344L597.173 -87.387L450.402 -548.281L617.666 -94.4223L628.5 -578Z"
          fill="#00DC82"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_199_94966"
          x="0.873535"
          y="-659"
          width="1255.25"
          height="1251.52"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="40.5"
            result="effect1_foregroundBlur_199_94966"
          />
        </filter>
      </defs>
    </svg>

    <div class="w-[600px] pl-[100px]">
      <p
        v-if="headline"
        class="uppercase text-[24px] mb-4 font-semibold"
        :style="{ color: accentColor }"
      >
        {{ headline }}
      </p>
      <h1
        v-if="title"
        class="w-[600px] m-0 text-[75px] font-semibold mb-4 flex items-center"
        :style="{ color: textColor }"
      >
        <span>{{ title }}</span>
      </h1>
      <p
        v-if="description"
        class="text-[32px] leading-tight"
        :style="{ color: subTextColor }"
      >
        {{ description }}
      </p>
    </div>

    <!-- Improved Remote Desktop Logo -->
    <svg
      class="absolute top-[160px] right-[90px]"
      width="340"
      height="340"
      viewBox="0 0 340 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Background Circle -->
      <path
        d="M86.6286 103.106C88.2099 94.7477 94.7477 88.2099 103.106 86.6286L104.427 86.3788C146.343 78.4485 189.386 78.5576 231.262 86.7002L232.272 86.8967C239.615 88.3244 245.4 93.99 246.981 101.301L247.277 102.671C256.565 145.63 256.438 190.092 246.903 232.997C245.361 239.939 239.939 245.361 232.997 246.903C190.092 256.438 145.63 256.565 102.671 247.277L101.301 246.981C93.99 245.4 88.3244 239.615 86.8967 232.272L86.7002 231.262C78.5576 189.386 78.4485 146.343 86.3788 104.426L86.6286 103.106Z"
        :fill="
          colorMode === 'light' ? '#f1f5f9' : 'url(#paint0_linear_199_94959)'
        "
      />

      <!-- Circle Borders -->
      <path
        d="M86.6286 103.106C88.2099 94.7477 94.7477 88.2099 103.106 86.6286L104.427 86.3788C146.343 78.4485 189.386 78.5576 231.262 86.7002L232.272 86.8967C239.615 88.3244 245.4 93.99 246.981 101.301L247.277 102.671C256.565 145.63 256.438 190.092 246.903 232.997C245.361 239.939 239.939 245.361 232.997 246.903C190.092 256.438 145.63 256.565 102.671 247.277L101.301 246.981C93.99 245.4 88.3244 239.615 86.8967 232.272L86.7002 231.262C78.5576 189.386 78.4485 146.343 86.3788 104.426L86.6286 103.106Z"
        fill="url(#paint1_radial_199_94959)"
        fill-opacity="0.06"
      />
      <path
        d="M103.028 86.2151C94.4994 87.8286 87.8286 94.4994 86.2151 103.028L85.9653 104.348C78.0252 146.318 78.1344 189.414 86.2872 231.342L86.4836 232.353C87.9434 239.86 93.7366 245.776 101.212 247.392L102.582 247.688C145.601 256.989 190.124 256.862 233.089 247.314C240.19 245.736 245.736 240.19 247.314 233.089C256.862 190.124 256.989 145.601 247.688 102.582L247.392 101.212C245.776 93.7366 239.86 87.9434 232.353 86.4836L231.342 86.2872C189.414 78.1344 146.318 78.0252 104.348 85.9653L103.028 86.2151Z"
        stroke="url(#paint2_linear_199_94959)"
        stroke-opacity="0.2"
        stroke-width="0.841584"
      />
      <path
        d="M66.1749 44.2983C55.2117 46.6476 46.6475 55.2117 44.2983 66.1749L43.1523 71.5228C29.5422 135.037 29.5422 200.713 43.1523 264.227L44.425 270.166C46.7026 280.795 54.917 289.15 65.5055 291.608C132.857 307.243 203.127 307.189 270.477 291.554C280.924 289.129 289.129 280.924 291.554 270.477C307.189 203.127 307.243 132.857 291.608 65.5055C289.15 54.917 280.795 46.7026 270.166 44.425L264.227 43.1523C200.713 29.5422 135.037 29.5422 71.5228 43.1523L66.1749 44.2983Z"
        stroke="url(#paint4_linear_199_94959)"
        stroke-opacity="0.4"
        stroke-width="1.7"
      />

      <!-- Improved Remote Desktop/Cloud Gaming Logo -->
      <g>
        <!-- Cloud -->
        <ellipse
          cx="170"
          cy="125"
          rx="42"
          ry="15"
          fill="#00DC82"
          fill-opacity="0.2"
        />
        <ellipse
          cx="170"
          cy="125"
          rx="38"
          ry="13"
          fill="#00DC82"
          fill-opacity="0.4"
        />

        <!-- Monitor -->
        <rect x="110" y="140" width="120" height="75" rx="3" fill="#00DC82" />
        <rect x="112" y="142" width="116" height="71" rx="2" fill="#1A1C3A" />

        <!-- Screen Content -->
        <rect x="122" y="152" width="96" height="51" rx="1" fill="#111226" />

        <!-- Windows/App Icons on Screen -->
        <rect
          x="127"
          y="157"
          width="20"
          height="14"
          rx="1"
          fill="#00DC82"
          fill-opacity="0.3"
        />
        <rect
          x="152"
          y="157"
          width="20"
          height="14"
          rx="1"
          fill="#00DC82"
          fill-opacity="0.4"
        />
        <rect
          x="177"
          y="157"
          width="20"
          height="14"
          rx="1"
          fill="#00DC82"
          fill-opacity="0.5"
        />
        <rect
          x="202"
          y="157"
          width="11"
          height="14"
          rx="1"
          fill="#00DC82"
          fill-opacity="0.6"
        />

        <!-- Taskbar -->
        <rect
          x="127"
          y="192"
          width="86"
          height="6"
          rx="1"
          fill="#00DC82"
          fill-opacity="0.2"
        />

        <!-- Connection Lines from Cloud to Screen -->
        <path
          d="M147 125 L127 140"
          stroke="#00DC82"
          stroke-width="1.4"
          stroke-dasharray="2 1"
        />
        <path
          d="M170 125 L170 140"
          stroke="#00DC82"
          stroke-width="1.4"
          stroke-dasharray="2 1"
        />
        <path
          d="M193 125 L213 140"
          stroke="#00DC82"
          stroke-width="1.4"
          stroke-dasharray="2 1"
        />

        <!-- Stand -->
        <path d="M155 215 L185 215 L180 225 L160 225 Z" fill="#00DC82" />
        <rect x="165" y="215" width="10" height="5" fill="#00DC82" />
        <rect x="167" y="215" width="6" height="12" fill="#00DC82" />

        <!-- Small Device (Remote) -->
        <rect x="195" y="185" width="18" height="30" rx="2" fill="#00DC82" />
        <rect x="197" y="187" width="14" height="22" rx="1" fill="#1A1C3A" />
        <rect x="198" y="189" width="12" height="18" rx="1" fill="#111226" />

        <!-- Connection from Device to Screen -->
        <path
          d="M195 195 L190 180"
          stroke="#00DC82"
          stroke-width="1"
          stroke-dasharray="2 1"
        />
      </g>

      <defs>
        <linearGradient
          id="paint0_linear_199_94959"
          x1="167.875"
          y1="74.375"
          x2="88"
          y2="261"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#0F172A" />
          <stop offset="1" stop-color="#0F172A" stop-opacity="0" />
        </linearGradient>
        <radialGradient
          id="paint1_radial_199_94959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(167.875 167.875) rotate(-90) scale(100.596 107.502)"
        >
          <stop stop-color="white" />
          <stop offset="1" stop-opacity="0" />
        </radialGradient>
        <linearGradient
          id="paint2_linear_199_94959"
          x1="247.183"
          y1="96.4978"
          x2="194.172"
          y2="229.234"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="white" />
          <stop offset="1" stop-opacity="0" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_199_94959"
          x1="292.405"
          y1="57.8159"
          x2="209.877"
          y2="264.463"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#00DC82" />
          <stop offset="1" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>
