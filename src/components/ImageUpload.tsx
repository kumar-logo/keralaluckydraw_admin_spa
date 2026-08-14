import { useState } from 'react';
import { Upload, message, Input } from 'antd';
import { PlusOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { getApiBaseUrl } from '../config/env';
import { resolveAssetUrl } from '../utils/assetUrl';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  maxSize?: number;
  allowUrlInput?: boolean;
  urlPlaceholder?: string;
  folder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  maxSize = 5,
  allowUrlInput = true,
  urlPlaceholder = 'Or paste an image URL',
  folder,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('admin_token');
  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  const uploadPath = folder
    ? `/admin/api/v1/upload?folder=${folder}`
    : '/admin/api/v1/upload';

  const uploadProps: UploadProps = {
    name: 'file',
    action: apiBase ? apiBase + uploadPath : uploadPath,
    headers: token ? { Token: token } : undefined,
    showUploadList: false,
    accept: 'image/*',
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Only image files are allowed');
        return false;
      }
      const isSmallEnough = file.size / 1024 / 1024 < maxSize;
      if (!isSmallEnough) {
        message.error(`Image must be smaller than ${maxSize}MB`);
        return false;
      }
      return true;
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        setLoading(true);
        return;
      }
      if (info.file.status === 'done') {
        setLoading(false);
        const res = info.file.response;
        if (res?.code === 0 && res?.data?.url) {
          onChange?.(res.data.url);
          message.success('Upload successful');
        } else if (res?.url) {
          onChange?.(res.url);
          message.success('Upload successful');
        }
      }
      if (info.file.status === 'error') {
        setLoading(false);
        message.error('Upload failed');
      }
    },
  };

  return (
    <div>
      <Upload {...uploadProps} listType="picture-card">
        {value ? (
          <img
            src={resolveAssetUrl(value)}
            alt="uploaded"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
      {allowUrlInput && (
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={urlPlaceholder}
          prefix={<LinkOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          style={{ marginTop: 4, maxWidth: 360 }}
        />
      )}
    </div>
  );
}
