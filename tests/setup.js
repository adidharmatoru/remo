import { vi } from 'vitest';

// Mock window methods
/*global global*/
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock WebRTC
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
  createOffer: vi.fn(),
  createAnswer: vi.fn(),
  setLocalDescription: vi.fn(),
  setRemoteDescription: vi.fn(),
  addIceCandidate: vi.fn(),
  close: vi.fn(),
  onicecandidate: null,
  ontrack: null,
  addTrack: vi.fn()
}));

// Mock MediaDevices
global.navigator.mediaDevices = {
  getUserMedia: vi.fn()
};

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Add to existing setup.js
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // WebSocket.OPEN
  OPEN: 1,
  CLOSED: 3
}));

// Add to existing setup.js
global.navigator.getGamepads = vi.fn().mockReturnValue([]);
