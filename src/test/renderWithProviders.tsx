import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';

interface ProvidersOptions {
  route?: string;
}

const buildWrapper =
  ({ route = '/' }: ProvidersOptions) =>
  ({ children }: { children: ReactNode }) => (
    <ConfigProvider>
      <AntApp>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AntApp>
    </ConfigProvider>
  );

export const renderWithProviders = (
  ui: ReactElement,
  options: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult => {
  const { route, ...rest } = options;
  return render(ui, { wrapper: buildWrapper({ route }), ...rest });
};
