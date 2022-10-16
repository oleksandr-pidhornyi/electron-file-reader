## About
This is a simple electron app that scans any selected folder, and shows info on the contents of this folder.

[Link to the original boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## Screenshot
![plot](./Screenshot.png)

## Install and run

Clone the repo and install dependencies:

```bash
npm install
```

To run the app in dev mode type
```bash
npm start
```

To tun the tests
```bash
npm run build:main
npm run build:renderer
npm test
```

## How does it work?
The app is build using `electron` framework. For communication between threads it uses proper and secure (hopefully) `IPC` channels, and it uses `Web Workers` to scan the file system asynchronously to avoid freezing up of the UI.

## What's missing?
This project is not entirely production ready, unfortunately. I was having hard time getting it compiled for production, and since I'm not super experienced with Electron, it would be a deep dive for me to understand why the production build is failing.

Also I'm not happy with the tests that I made. I'm not exactly sure how to mock `IPC` requests for integration testing, and also couldn't test the Web Worker code because importing it seemed tricky. My `node.js` testing skills are rusty.



## Contact

Please shoot a letter to my [email](mailto:pidhornyialex@gmail.com) if you have any questions
