/// <reference types="node" />
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.APP_URL || 'https://govscalealliance-app-clone-dsw8d.ondigitalocean.app/',
    headless: isCI ? true : false,
    viewport: isCI ? { width: 1280, height: 800 } : null,
    launchOptions: isCI ? {} : { args: ['--start-maximized'] },
  },
});