const isSameYear = require("date-fns/is_same_year");

const toArray = posts => {
  return Object.values(posts);
};

const byYear = (posts, year) => {
  const yearDate = new Date(year, 6, 6);
  return posts.filter(post => {
    return isSameYear(yearDate, new Date(post.createdAt));
  });
};

const sortMostLiked = posts => {
  return posts.sort((prevPost, nextPost) => {
    return parseFloat(nextPost.likes) - parseFloat(prevPost.likes);
  });
};

const serializeProfile = (name, posts, year) => {
  const mostLiked = sortMostLiked(byYear(toArray(posts), year))
    .slice(0, 9)
    .map(p => p.id);
  return {
    posts,
    year,
    name,
    [`mostLiked${year}`]: mostLiked
  };
};

module.exports = {
  toArray,
  byYear,
  sortMostLiked,
  serializeProfile
};
