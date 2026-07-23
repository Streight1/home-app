import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoginPage } from '../../features/auth/pages/LoginPage.js';

const meta = {
  title: 'Screens/LoginPage',
  component: LoginPage,
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {
  parameters: { theme: 'dark', viewport: { defaultViewport: 'desktop' } },
};
export const Mobile: Story = {
  parameters: { theme: 'dark', viewport: { defaultViewport: 'mobile1' } },
};
export const DesktopLight: Story = {
  parameters: { theme: 'light', viewport: { defaultViewport: 'desktop' } },
};
export const MobileLight: Story = {
  parameters: { theme: 'light', viewport: { defaultViewport: 'mobile1' } },
};
