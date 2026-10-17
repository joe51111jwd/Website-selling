// Which version of the site this build is: the editorial paper design (default) or Liquid Glass.
// The glass version is the same site and content, built with PUBLIC_THEME=glass.
export const glass = import.meta.env.PUBLIC_THEME === 'glass';
