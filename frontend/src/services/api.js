/**
 * SafeSight AI - API Client Service
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Fetch with a timeout (default 30s). Throws on timeout or network error. */
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function getScenarios() {
  const res = await fetch(`${API_BASE}/api/scenarios`);
  return res.json();
}

export async function getScenarioTelemetry(scenarioId) {
  const res = await fetchWithTimeout(
    `${API_BASE}/api/scenarios/${scenarioId}/telemetry`,
    {},
    45000  // 45s max – enough for 100-frame cloud inference
  );
  if (!res.ok) throw new Error('Failed to fetch scenario telemetry');
  return res.json();
}

export async function getVideos() {
  const res = await fetch(`${API_BASE}/api/videos`);
  return res.json();
}

export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function analyzeFrame(base64Image, frameIndex = 0, timestamp = 0.0) {
  const res = await fetch(`${API_BASE}/api/analyze/frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      frame_index: frameIndex,
      timestamp: timestamp,
    }),
  });
  if (!res.ok) throw new Error('Frame analysis failed');
  return res.json();
}

export async function getIncidentReport(videoId) {
  const res = await fetch(`${API_BASE}/api/report/${videoId}`);
  if (!res.ok) throw new Error('Incident report not found');
  return res.json();
}

export function getReportDownloadUrl(videoId) {
  return `${API_BASE}/api/report/${videoId}/download`;
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics`);
  return res.json();
}

export function getVideoUrl(urlPath) {
  if (!urlPath) return '';
  if (urlPath.startsWith('http')) return urlPath;
  return `${API_BASE}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
}
