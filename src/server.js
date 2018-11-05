const express = require("express");
const puppeteer = require("puppeteer");
const { fork } = require("child_process");
const isSameYear = require("date-fns/is_same_year");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { getHTML, loadMorePosts, getVisiblePosts } = require("./instagram");
const { processImage } = require("./process-image");
const app = express();
const port = process.env.PORT || 3000;
const {
  toArray,
  byYear,
  sortMostLiked,
  serializeProfile
} = require("./aggregation");

const write = promisify(fs.writeFile);

(async () => {
  const browser = await puppeteer.launch();
  app.get("/profile/:id.png", async (req, res) => {
    const name = req.params.id;
    console.log(`Getting profile info for ${name}`);
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
      console.log(`Processing page ${pageNumber} for ${name}`);
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
    const profile = serializeProfile(name, posts, year);

    // cache;
    const cachepath = path.resolve(
      process.cwd(),
      `./data/${name}-${year}.json`
    );
    await write(cachepath, JSON.stringify(profile, null, " "));

    // process image
    const image = await processImage(profile);
    res.contentType("image/png");
    res.send(image);
  });

  app.get("/test-render", async (req, res) => {
    const profile = require(path.resolve(
      process.cwd(),
      `./data/jcblw-2018.json`
    ));
    const image = await processImage(profile);
    res.contentType("image/png");
    res.send(image);
  });

  app.get("/top9/:username", async (req, res) => {
    const child = fork(path.resolve(__dirname, "./child.js"));
    child.send(req.params.username);
    child.on("exit", () => {
      console.log(`${child.pid} child shut down`);
    });
    res.send(200);
  });

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
})().catch(() => {});
