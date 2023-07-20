import { Component, createRef } from 'preact';

import SourceManager from './source-manager';
import FaceWatcher from './face-watcher';
import type { DetectedFaces } from './face-watcher';
import generateFolds from './face-fold-generator';
import Renderer from './renderer';

import RenderCanvas from './render-canvas';
import SettingsBar from '@/ui/settings-bar';
import ShutterBar from '@/ui/shutter-bar';
import ErrorOverlay from '@/ui/error-overlay';

export default class App extends Component {
    private sourceManager = new SourceManager({
        beforeCameraReloads: this.beforeCameraReloads.bind(this),
        onCameraReloaded: this.onCameraReloaded.bind(this)
    });
    private faceWatcher = new FaceWatcher(this.onDetectFaces.bind(this));
    private renderer = new Renderer(this.onRequestResize.bind(this));
    private renderCanvas = createRef<RenderCanvas>();

    private availableFeatures = {
        renderer: false,
        faceWatcher: false,
        camera: false,
    };

    state = {
        error: {
            showing: false,
            message: '',
        },

        srcDimensions: {
            width: 1,
            height: 1
        }
    };

    private get showingError() {
        return this.state.error.showing;
    }

    async componentDidMount() {
        await this.init();
        this.run();
    }

    componentWillUnmount() {
        this.stop();
    }

    async init() {
        this.initRenderer();

        await Promise.all([
            this.initCamera(),
            this.initFaceWatcher()
        ]);
    }

    stop() {
        this.renderer.stop();
        this.faceWatcher.stop();
    }

    private run() {
        this.syncSource();

        this.renderer.start();
        this.faceWatcher.start();
    }

    async initCamera() {
        try {
            await this.sourceManager.initCamera();
            this.availableFeatures.camera = true;
        } catch (err) {
            this.onError(
                err as Error,
                `Your camera isn't available for use. Didn't intend this? You can re-enable it for this app in your browser settings, then refresh.`
            );
        }
    }

    async initFaceWatcher() {
        try {
            await this.faceWatcher.load();
            this.availableFeatures.faceWatcher = true;
        } catch (err) {
            this.onError(
                err as Error,
                `Face detector couldn't load. Please refresh and try again.`
            );
        }
    }

    private initRenderer() {
        const canvasElem = this.renderCanvas.current?.element;
        if (!canvasElem) {
            const noCanvasErr = new Error('Canvas unavailable.');
            this.onError(noCanvasErr);

            return;
        }

        try {
            this.renderer.initContextFromCanvas(canvasElem);
            this.availableFeatures.renderer = true;
        } catch (err) {
            this.onError(
                err as Error,
                `WebGL2 isn't available on your device. This app only works with devices supporting WebGL2.`
            );
        }
    }

    private syncSource() {
        this.renderer.source = this.sourceManager.current;
        this.faceWatcher.source = this.sourceManager.current;

        const newSrcDimensions =
            this.sourceManager.current.getDimensions();

        this.setState({
            srcDimensions: newSrcDimensions
        });
    }

    private onDetectFaces(faces: DetectedFaces) {
        if (!this.renderer)
            return;

        const normDivisor = this.sourceManager.current.getNormDivisor();
        const newFolds = faces.map(
            face => generateFolds(face, normDivisor)
        );

        this.renderer.folds = newFolds;
    }

    private handleShutter() {
        if (!this.renderCanvas.current)
            return;

        this.sourceManager.pauseCurrent();

        const srcDims = this.sourceManager.current.getDimensions();
        const renderCanvas = this.renderCanvas.current;

        renderCanvas.stopWatchingResizes();

        // TODO might be cool to show a flash and still freeze the image to show the user what they got
        renderCanvas.resizeToDimensions(srcDims);
        App.downloadCanvasImage(this.renderer, renderCanvas);

        renderCanvas.watchResizes();

        this.sourceManager.resumeCurrent();
    }

    private static downloadCanvasImage(renderer: Renderer, renderCanvas: RenderCanvas) {
        // Must trigger a re-render now or we get a blank image
        renderer.forceRender();
        const imageData = renderCanvas.getAsImage();
        if (!imageData)
            return;

        // Forcing download requires us to create a proxy anchor tag
        // and clicking it to trigger the download
        const anchorElem = document.createElement('a');
        anchorElem.setAttribute('href', imageData);

        const fileName = `phold-image-${new Date().getTime()}.jpg`;
        anchorElem.setAttribute('download', fileName);

        document.body.appendChild(anchorElem);
        anchorElem.click();
        document.body.removeChild(anchorElem);
    }

    private onError(err: Error, usrMessage?: string) {
        this.logError(err);

        // Prevent new errors from updating if error modal already showing
        if (!this.showingError)
            this.showError(usrMessage ?? err.message);
    }

    private logError(err: Error) {
        console.error(err);
    }

    private showError(message: string) {
        this.setState({
            error: {
                showing: true,
                message
            }
        });
    }

    private hideError() {
        this.setState({
            error: {
                showing: false,
                message: ''
            }
        });
    }

    private onRequestResize() {
        this.renderCanvas.current?.fitWithinContainer();
    }

    private beforeCameraReloads() {
        this.stop();
    }

    private onCameraReloaded() {
        this.run();
    }

    render() {
        return (
            <>
                <ErrorOverlay
                    visible={this.state.error.showing}
                    message={this.state.error.message}
                    onClose={this.hideError.bind(this)}
                />
                <SettingsBar
                />
                <RenderCanvas
                    ref={this.renderCanvas}
                    srcDimensions={this.state.srcDimensions}
                />
                <ShutterBar
                    shutterCallback={this.handleShutter.bind(this)}
                />
            </>
        );
    }
}
