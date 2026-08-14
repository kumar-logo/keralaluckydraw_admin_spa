import { getApiBaseUrl } from '../config/env';

export async function downloadFile(
  path: string,
  fallbackName: string,
): Promise<void> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${getApiBaseUrl()}/admin/api/v1${path}`, {
    method: 'GET',
    headers: token ? { Token: token } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  const contentType = res.headers.get('Content-Type');
  if (contentType !== null && contentType.includes('text/html')) {
    throw new Error('Download failed: server returned an unexpected response');
  }
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition ? disposition.match(/filename="?([^"]+)"?/) : null;
  const fileName = match ? match[1] : fallbackName;
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
