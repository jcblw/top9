const Drawable = require("drawable").default;
const got = require("got");

const makeSquareImage = async (src, size) => {
  const drawable = new Drawable({
    width: size,
    height: size,
    backgroundColor: "white"
  });
  const resp = await got.get(src, { encoding: null });
  const image = Drawable.image(resp.body, {
    objectFit: "cover"
  });
  await drawable.append(image);
  return drawable.toBuffer();
};

const processImage = async (profile, size = 1080) => {
  const imageSize = size / 3;
  const year = profile.year;
  const drawable = new Drawable({
    width: size,
    height: size,
    backgroundColor: "white"
  });
  let top = 0;
  let left = 0;
  await profile[`mostLiked${year}`].reduce((accum, id) => {
    return accum.then(async () => {
      const post = profile.posts[id];
      const squareImage = await makeSquareImage(post.image, imageSize);
      const image = Drawable.image(squareImage, {
        top,
        left,
        width: imageSize,
        height: imageSize
      });
      await drawable.append(image);
      if (left + imageSize >= size) {
        top += imageSize;
        left = 0;
      } else {
        left += imageSize;
      }
    });
  }, Promise.resolve());
  return drawable.toBuffer();
};

module.exports = { processImage };
