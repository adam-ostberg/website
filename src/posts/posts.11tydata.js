export default {
  layout: "layouts/post.njk",
  sideNav: "posts",
  sideNavLabel: "Blog",
  eleventyComputed: {
    permalink: (data) => `/blog/${data.page.fileSlug}/`,
  },
};
