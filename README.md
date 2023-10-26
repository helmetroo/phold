# [phold](https://phold.app)

A camera app that folds faces in-browser. Inspired by Aphex Twin's [promotional images for Syro](https://en.wikipedia.org/wiki/Syro#Release) and visuals for live shows (particularly those from 2017-2019).

The "ph" in the name came from A*ph*ex Twin's *Ph*lange *Ph*ace. I originally called it *phacephold*, but I wanted something shorter, so I went with *phold*.

* **[Requirements](#reqs)**
* **[License](#license)**
* **[How to use](#how-to-use)**
  * **[Adjustments](#adjustments)**
* **[How it works](#how-it-works)**
* **[Limitations](#limitations)**
* **[Developing](#developing)**
  * **[Setup](#setup)**
    * **[Modules](#modules)**
    * **[SSL Certificate](#ssl-cert)**
  * **[Local development](#local-dev)**
  * **[Previewing for production](#prod-preview)**
* **[What's next?](#whats-next)**
* **[Older attempt](#older-attempt)**


<a name="reqs"></a>
# Requirements

phold uses vite's default browser targets which are at least:

- Chrome 87
- Firefox 78
- Safari 14
- Edge 88


<a name="license"></a>
# License

TBD.


<a name="how-to-use"></a>
# How to use

**phold** works like the camera app on your phone.

Take pictures with the shutter button. You'll most likely be prompted where to save them each time you take a photo, or your pictures will be saved to your browser's selected download folder.

Switch between your front and rear camera with the <flip> button.

You can also choose an existing image (jpg, png, non-animated gif and webp) to fold faces. If it looks good enough for you, hit the check, or reject it by hitting X.


<a name="adjustments"></a>
## Adjustments

You can bring down an adjustments drawer with the <adjustments> button at any time. Currently, you can tweak the scale, width and position of the folds. Ideas for other adjustments and app-specific settings are in GitHub issues.


<a name="how-it-works"></a>
# How it works

**phold** leverages [face-api.js](https://github.com/justadudewhohacks/face-api.js) to detect faces in camera/static images entirely *in-browser*, as well as determine the positions of specific face features.

To keep the app size reasonably small, and ensure decent real-time performance regardless of device, face-api's tiny face detector (face_landmark_68_tiny_model) was chosen.

For each detected face in an image, the positions of the eyes and mouth are used as a basis for computing the eye and mouth "fold" rectangle vertices.

Both "fold" rectangles are rendered on top of the camera/chosen image in a canvas with WebGL 2.x, but will fallback to 1.x if your device does not support 2.x.


<a name="limitations"></a>
# Limitations

By choice, camera images are only FHD (1920x1080) resolution. I wanted to pick a resolution that was decent enough, but not too large to the point where the performance of realtime face folding is compromised. A feature to change the camera image size is [not yet implemented](https://github.com/helmetroo/phold/issues/13).

Large static images may take a considerable time to process and stall the UI. There's a [GitHub issue](https://github.com/helmetroo/phold/issues/17) with some ideas on how to best solve this.

In certain cases, faces might not always be detected. A feature to have an app-specific settings drawer to tweak the settings of the tiny face detector already being leveraged, as well as an advanced setting to let someone try out more accurate face detector models is [not yet implemented](https://github.com/helmetroo/phold/issues/13).


<a name="developing"></a>
# Developing

**NOTE**: Personally untested with [Bun](https://bun.sh). I'd imagine the Bun analogs to these commands should work...

<a name="setup"></a>
## Setup

Clone this repo.

```bash
git clone https://github.com/helmetroo/phold.git
```

<a name="modules"></a>
### SSL Certificate

Serving the app over HTTPS is necessary in order to use your device cam with this app, regardless of whether it is hosted locally or not.

Make a `.cert` directory in the project root with key and cert files `key.pem` and `cert.pem`.

You can create one with `[mkcert](https://github.com/FiloSottile/mkcert)`. Here's a [tutorial](https://stackoverflow.com/a/69743888) you can follow.


<a name="local-dev"></a>
### Modules

Install required modules.

```bash
npm install
```

<a name="ssl-cert"></a>
## Local development

While working on the app locally, you can run a dev server that automatically reloads when you make changes to the source code:

```bash
npm run dev
```


<a name="prod-preview"></a>
## Previewing for production

You can run a preview server to simulate how the production build will run. Run the `build` command first:

```bash
npm run build
```

The command first runs the TypeScript compiler to typecheck the app. If typechecks fail with **any** errors or warnings, the build won't proceed.

After a successful build, you can run the preview server:

```bash
npm run preview
```

If you prefer, here are the steps above in a one-liner:

```bash
npm run build && npm run preview
```

<a name="older-attempt"></a>
# Older attempt

I first attempted this app a few years ago, but lost steam on it. Here's the [archived repo](https://github.com/helmetroo/phacephold) for that.

<a name="whats-next"></a>
# What's next?

Adding new features that I'd like to see and fixing bugs.

Ideas for new features, enhancements and bugs are all in the project [issues](https://github.com/helmetroo/phold/issues).

Feel free to add an issue for a bug you found or feature you think would be great, but please check to see if there's already an issue for it first (thank you <3).

## *Have fun!*

# :|)
