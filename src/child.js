const puppeteer = require("puppeteer");
const isSameYear = require("date-fns/is_same_year");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { getHTML, loadMorePosts, getVisiblePosts } = require("./instagram");
const { processImage } = require("./process-image");
const {
  toArray,
  byYear,
  sortMostLiked,
  serializeProfile
} = require("./aggregation");

const write = promisify(fs.writeFile);

const log = msg => {
  console.log(`${process.pid}: ${msg}`);
};

const processProfile = async name => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://www.instagram.com/${name}`);
  const posts = { errors: [] };
  const year = 2018;
  const yearDate = new Date(year, 1, 1);
  // loop variables
  var pageNumber = 1;
  var needsMore = true;
  var lastPostAmount = 0;

  while (needsMore) {
    log(`Processing page ${pageNumber} for ${name}`);
    await getVisiblePosts(page, posts);
    await loadMorePosts(page);
    console.log(posts.lastProcessedTime);
    if (
      !isSameYear(new Date(posts.lastProcessedTime), yearDate) ||
      // no more posts
      toArray(posts).length === lastPostAmount
    ) {
      needsMore = false;
    }
    lastPostAmount = toArray(posts).length;
    pageNumber += 1;
  }

  page.close();

  if (posts.errors.length) {
    posts.errors.forEach(e => console.error(e));
  }
  delete posts.errors;
  log(`processing image for ${name}`);
  const profile = serializeProfile(name, posts, year);

  // cache;
  const cachePath = path.resolve(process.cwd(), `./data/${name}-${year}.json`);
  await write(cachePath, JSON.stringify(profile, null, " "));

  const imagePath = path.resolve(process.cwd(), `./data/${name}-${year}.png`);
  const image = await processImage(profile);
  await write(imagePath, image);
  process.exit(0);
};

process.on("message", async chunk => {
  const name = console.log(chunk);
  try {
    await processProfile(chunk);
  } catch (e) {
    throw e;
    process.exit(1);
  }
});
