import { useState } from 'react';
import { Upload, message, Input, Button } from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { getApiBaseUrl } from '../config/env';
import { resolveAssetUrl } from '../utils/assetUrl';

interface MultiImageUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxCount?: number;
  maxSize?: number;
  folder?: string;
}

interface UploadResponse {
  code?: number;
  data?: { url?: string };
  url?: string;
}

const extractUrl = (file: UploadFile): string | undefined => {
  const res = file.response as UploadResponse | undefined;
  if (res?.code === 0 && res.data?.url) return res.data.url;
  if (res?.url) return res.url;
  return undefined;
};

export default function MultiImageUpload({
  value,
  onChange,
  maxCount = 6,
  maxSize = 5,
  folder,
}: MultiImageUploadProps) {
  const token = localStorage.getItem('admin_token');
  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  const uploadPath = folder
    ? `/admin/api/v1/upload?folder=${folder}`
    : '/admin/api/v1/upload';

  const [fileList, setFileList] = useState<UploadFile[]>(() =>
    (Array.isArray(value) ? value : []).map((url, index) => ({
      uid: `init-${index}`,
      name: url.split('/').pop() ?? `image-${index}`,
      status: 'done' as const,
      url: resolveAssetUrl(url),
      response: { url },
    })),
  );

  const [urlInput, setUrlInput] = useState('');

  const emit = (list: UploadFile[]): void => {
    const urls = list
      .filter((f) => f.status === 'done')
      .map(extractUrl)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
    onChange?.(urls);
  };

  const addUrl = (): void => {
    const url = urlInput.trim();
    if (url.length === 0) return;
    if (fileList.filter((f) => f.status !== 'error').length >= maxCount) {
      message.error(`Up to ${maxCount} images allowed`);
      return;
    }
    const next: UploadFile[] = [
      ...fileList,
      {
        uid: `url-${fileList.length}-${url}`,
        name: url.split('/').pop() ?? 'image',
        status: 'done' as const,
        url: resolveAssetUrl(url),
        response: { url },
      },
    ];
    setFileList(next);
    emit(next);
    setUrlInput('');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: apiBase ? apiBase + uploadPath : uploadPath,
    headers: token ? { Token: token } : undefined,
    listType: 'picture-card',
    accept: 'image/*',
    multiple: true,
    maxCount,
    fileList,
    beforeUpload(file) {
      if (!file.type.startsWith('image/')) {
        message.error('Only image files are allowed');
        return Upload.LIST_IGNORE;
      }
      if (file.size / 1024 / 1024 >= maxSize) {
        message.error(`Image must be smaller than ${maxSize}MB`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onChange(info) {
      setFileList(info.fileList);
      if (info.file.status === 'done') message.success('Uploaded');
      if (info.file.status === 'error') message.error('Upload failed');
      emit(info.fileList);
    },
    onPreview(file) {
      const src = file.url ?? resolveAssetUrl(extractUrl(file));
      if (src) window.open(src, '_blank', 'noopener');
    },
  };

  const reachedMax =
    fileList.filter((f) => f.status !== 'error').length >= maxCount;

  return (
    <div>
      <Upload {...uploadProps}>
        {reachedMax ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
      <Input
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onPressEnter={addUrl}
        placeholder="Or paste an image URL / path"
        prefix={<LinkOutlined style={{ color: 'var(--text-muted)' }} />}
        allowClear
        style={{ marginTop: 4, maxWidth: 360 }}
        addonAfter={
          <Button
            type="link"
            size="small"
            onClick={addUrl}
            style={{ padding: 0, height: 'auto' }}
          >
            Add
          </Button>
        }
      />
    </div>
  );
}
