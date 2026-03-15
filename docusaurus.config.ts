import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'n3gb-rs',
  tagline: 'Hex-based spatial indexing for British National Grid',

  future: {
    v4: true,
  },

  url: 'https://chriscarlon.github.io',
  baseUrl: '/n3gb-docs/',

  organizationName: 'CHRISCARLON',
  projectName: 'n3gb-docs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700;800&display=swap',
      },
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
    },
    navbar: {
      title: 'n3gb-rs',
      items: [
        {
          href: 'https://github.com/CHRISCARLON/n3gb-rs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright \u00A9 ${new Date().getFullYear()} n3gb-rs. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'toml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
