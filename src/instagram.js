const cheerio = require("cheerio");

const sleep = duration => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

const getIndividualMeta = page => async (id, timeout = 1000) => {
  if (!id) return {};
  if (id.length !== 11) return {};
  await page.evaluate(id => {
    const element = document.querySelector(`[href="/p/${id}/"]`);
    element && element.click();
  }, id);
  await sleep(timeout);
  // popover
  const { likes, comments, image, createdAt } = await page.evaluate(() => {
    const post = document.querySelector("[role='dialog'] article");
    const likeNode = post.querySelector("section:nth-child(2)");
    let likes = likeNode.textContent;
    if (likes.match(/views/g)) {
      // this is if its a video
      const buttonNode = likeNode.querySelector('[role="button"]');
      buttonNode.click();
      const tooltipNode = buttonNode.parentNode.querySelector("div");
      likes = buttonNode.parentNode.querySelector("div").textContent;
      // close tooltip
      tooltipNode.querySelector('[role="button"]');
    }
    const createdAt = post.querySelector("time").dateTime;
    const imageNode =
      post.querySelector("[srcset]") ||
      // video thumb
      post.querySelector("video").parentNode.querySelector("img");
    const image = imageNode && imageNode.src;
    const comments = Array.from(post.querySelectorAll("ul li"))
      .filter(x => x && x.textContent)
      .map(node => {
        const userNode = node.querySelector("h3") || node.querySelector("h2");
        const commentNode = node.querySelector("span");
        return {
          user: userNode && userNode.textContent,
          comment: commentNode && commentNode.textContent
        };
      });
    document.querySelector("[role='dialog'] > button").click();
    return { likes, comments, image, createdAt };
  });
  return {
    id,
    image,
    comments,
    likes,
    createdAt
  };
};

const getVisiblePosts = async (page, posts = {}) => {
  const $ = await getHTML(page);
  const $links = $("article a");
  const getMeta = getIndividualMeta(page);
  await $links.toArray().reduce((accum, link, i) => {
    const href = $(link).prop("href");
    const id = href.replace("/p/", "").replace("/", "");
    if (posts[id]) return Promise.resolve();
    return accum.then(async () => {
      try {
        const meta = await getMeta(id);
        posts[meta.id] = meta;
        posts.lastProcessedTime = meta.createdAt;
      } catch (e) {
        const error = new Error(`failed to process "${href}" link`);
        posts.errors.push(error);
        posts.errors.push(e);
      }
    });
  }, Promise.resolve());
};

const getHTML = async page => {
  const html = await page.evaluate(() => document.body.innerHTML);
  return cheerio.load(html);
};

const loadMorePosts = async page => {
  const timeout = 1000;
  await page.evaluate(() => window.scrollTo(0, 999999999));
  await sleep(timeout);
};

module.exports = { getHTML, loadMorePosts, getVisiblePosts };
