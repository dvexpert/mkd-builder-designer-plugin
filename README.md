# MKD Builder Designer Plugin

## Setup

1. Install dependencies
```sh
yarn install
```

2. Create Production Build
```sh
yarn build
```
- This will create the [mkd-plugin.es.js](dist/mkd-plugin.es.js) in dist folder
- This main file to be used.


## Contribution

1. Start dev build
```sh
yarn dev
```

2. Run [demo/index.html](demo/index.html)
- Vscode extension live server can be used
    - [Live Server By Ritwick Dey](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Or

PHP server can also be used from the root directory.
```sh
php -S localhost:5500
```

Visit: [localhost:5500/demo](http://localhost:5500/demo)



ToDO:
- [ ] Require .css file from the mkd-plugin.es.js so no need for extra file
- [ ] on zoom in and out/ also scale action overlay and attributes overlay
    - [ ] L Shape action overlay moved out of the shape group when rotated and zoom in applied.
- [ ] Fix Duplicate Action overlay and duplicate overlay appended in dom, from each shape manager but is used only one.

