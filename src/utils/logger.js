/**
 * Client-Side Web Telemetry Logger
 * Preserves history of AI prompts, token usage, and latency in localStorage
 */

const STORAGE_KEY = 'aura_dev_logs';
const MAX_LOGS = 150;

export function addLog({ 
  type = 'info', 
  apiType = 'unknown', 
  prompt = '', 
  model = '', 
  tokens = 0, 
  latency = 0, 
  status = 'success', 
  keyId = null,
  error = null 
}) {
  try {
    const logs = getLogs();
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      apiType,
      prompt,
      model,
      tokens,
      latency,
      status,
      keyId,
      error
    };

    const updatedLogs = [newLog, ...logs].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    
    // Dispatch a custom event so the DevPage can update in real-time
    window.dispatchEvent(new CustomEvent('aura_dev_updated', { detail: newLog }));
    
    return newLog;
  } catch (err) {
    console.error('[Logger] Failed to save log:', err);
    return null;
  }
}

export function getLogs() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('[Logger] Failed to retrieve logs:', err);
    return [];
  }
}

export function clearLogs() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('aura_dev_updated'));
}

export function getAggregatedStats() {
  const logs = getLogs();
  if (logs.length === 0) return { totalRequests: 0, avgLatency: 0, totalTokens: 0, successRate: 100 };

  const successLogs = logs.filter(l => l.status === 'success');
  const totalTokens = logs.reduce((acc, l) => acc + (l.tokens || 0), 0);
  const totalLatency = successLogs.reduce((acc, l) => acc + (l.latency || 0), 0);

  return {
    totalRequests: logs.length,
    avgLatency: successLogs.length > 0 ? (totalLatency / successLogs.length).toFixed(0) : 0,
    totalTokens,
    successRate: ((successLogs.length / logs.length) * 100).toFixed(1)
  };
}

const DEBUG_KEY = 'aura_debug_logs';

export function addDebugLog(message, level = 'info', data = null) {
  try {
    const logs = getDebugLogs();
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      message: String(message),
      level,
      data: data ? JSON.stringify(data) : null
    };

    const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep last 50
    localStorage.setItem(DEBUG_KEY, JSON.stringify(updatedLogs));
    
    // Dispatch a custom event
    window.dispatchEvent(new CustomEvent('aura_debug_updated', { detail: newLog }));
    
    return newLog;
  } catch (err) {
    console.error('[Logger] Debug log failed:', err);
    return null;
  }
}

export function getDebugLogs() {
  try {
    const data = localStorage.getItem(DEBUG_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

export function clearDebugLogs() {
  localStorage.setItem(DEBUG_KEY, '[]');
  window.dispatchEvent(new CustomEvent('aura_debug_updated'));
}
