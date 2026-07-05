// frontend/src/services/api.js
//
// Single source of truth for every network call the frontend makes to the
// Express backend. Both App.jsx (saving a completed run) and the future
// HistoryDashboard component (reading history + analytics) import from here
// instead of calling fetch() directly in multiple places.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Small wrapper around fetch that throws a readable error on non-2xx
 * responses and always returns parsed JSON.
 */
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

/**
 * POST /api/simulations
 * Saves a completed sorting simulation's stats.
 * @param {{algorithm: string, arraySize: number, executionTimeMs: number, comparisons: number, swaps: number}} stats
 */
export function saveSimulation(stats) {
  return request('/simulations', {
    method: 'POST',
    body: JSON.stringify(stats),
  });
}

/**
 * GET /api/simulations?limit=&page=&algorithm=
 * Fetches simulation history, most recent first.
 * @param {{limit?: number, page?: number, algorithm?: string}} params
 */
export function fetchSimulations(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ).toString();

  return request(`/simulations${query ? `?${query}` : ''}`);
}

/**
 * GET /api/simulations/analytics?arraySize=
 * Fetches aggregated average time/comparisons/swaps per algorithm.
 * @param {{arraySize?: number}} params
 */
export function fetchAnalytics(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ).toString();

  return request(`/simulations/analytics${query ? `?${query}` : ''}`);
}