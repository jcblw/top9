# top9

[![Greenkeeper badge](https://badges.greenkeeper.io/jcblw/top9.svg)](https://greenkeeper.io/)

A nodejs app to create top nine photos for instagram.

# usage

You will need

- [nodejs](https://nodejs.org/en/)!
- [yarn](https://yarnpkg.com/en/)!

This should setup just about everything. Right now, `nodejs >= 8` is needed.

```shell
yarn
mkdir data
yarn start
```

Visit `/top9/:username` and it will kick of a child process. The process will get all the profile Instagram info from a public profile and then create the image in the `/data` directory.

TODO:

- frontend
- ws to frontend
- more agressive caching
- private page errors
- timeouts
- story image size
