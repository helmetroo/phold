import { Component, createRef } from 'preact';

import SourceManager from './source-manager';
import FaceWatcher from './face-watcher';
import type { DetectedFaces } from './face-watcher';
import generateFolds from './face-fold-generator';
import Renderer from './renderer';

import AppError from '@/types/app-error';
import type ChosenFile from '@/types/chosen-file';

import RenderCanvas from './render-canvas';
import SettingsBar from '@/ui/settings-bar';
import ShutterBar from '@/ui/shutter-bar';
import ErrorOverlay from '@/ui/error-overlay';

type State = {
    error: {
        showing: boolean,
        message: string[] | string
    },
}
export default class App extends Component<{}, State> {
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
            message: [],
        }
    };

    private get showingError() {
        return this.state.error.showing;
    }

    async componentDidMount() {
        await this.init();

        // If camera ready must wait for it to be playing
        // or else we will get errors in texSubImage2D(...)
        if (this.availableFeatures.camera)
            await this.sourceManager.resumeCurrent();

        this.startAll();
    }

    componentWillUnmount() {
        this.stopAll();
    }

    async init() {
        this.initRenderer();

        await Promise.all([
            this.initCamera(),
            this.initFaceWatcher()
        ]);
    }

    stopAll() {
        this.renderer.stop();
        this.faceWatcher.stop();
    }

    private startAll() {
        this.syncSource();

        this.renderer.start();
        this.faceWatcher.start();
    }

    async initCamera() {
        try {
            await this.sourceManager.initCamera();
            this.availableFeatures.camera = true;
        } catch (err) {
            this.onError(err as Error);
        }
    }

    async initFaceWatcher() {
        try {
            await this.faceWatcher.load();
            this.availableFeatures.faceWatcher = true;
        } catch (err) {
            this.onError(err as Error);
        }
    }

    private initRenderer() {
        const canvasElem = this.renderCanvas.current?.element;
        if (!canvasElem) {
            const noCanvasErr = new AppError(
                'CanvasUnavailableErr',
                'Canvas unavailable.'
            );
            this.onError(noCanvasErr);

            return;
        }

        try {
            this.renderer.initContextFromCanvas(canvasElem);
            this.availableFeatures.renderer = true;
        } catch (err) {
            this.onError(err as Error);
        }
    }

    private syncSource() {
        const currentSource = this.sourceManager.current;
        this.renderer.source = currentSource;
        this.faceWatcher.source = currentSource;

        const currentSourceDims = currentSource.getDimensions();
        this.renderCanvas.current?.syncDimensions(currentSourceDims);
    }

    private onDetectFaces(faces: DetectedFaces) {
        if (!this.renderer)
            return;

        this.setFoldsFromFaces(faces);
    }

    private setFoldsFromFaces(faces: DetectedFaces) {
        const normDivisor = this.sourceManager.current.getNormDivisor();
        const newFolds = faces.map(
            face => generateFolds(face, normDivisor)
        );

        this.renderer.folds = newFolds;
    }

    private async handleChosenImage(chosenFile: ChosenFile) {
        const renderCanvas = this.renderCanvas.current;
        if (!renderCanvas)
            return;

        this.sourceManager.pauseCurrent();

        this.stopAll();

        await this.sourceManager.setAndLoadFromImage(chosenFile);
        this.syncSource();

        renderCanvas.resizeToContainer();

        const imageFaces = await this.faceWatcher.detectFaces();
        this.setFoldsFromFaces(imageFaces);

        this.renderer.forceRender();
    }

    private handleShutter() {
        const renderCanvas = this.renderCanvas.current;
        if (!renderCanvas)
            return;

        this.sourceManager.pauseCurrent();

        renderCanvas.stopWatchingResizes();

        // TODO might be cool to show a flash and still freeze the image to show the user what they got
        const srcDims = this.sourceManager.current.getDimensions();
        renderCanvas.resizeToDimensions(srcDims);
        App.downloadCanvasImage(this.renderer, renderCanvas);

        // After resizing we have to render again or the canvas goes blank
        renderCanvas.resizeToContainer();
        this.renderer.forceRender();

        renderCanvas.watchResizes();

        this.sourceManager.resumeCurrent();
    }

    private static downloadCanvasImage(renderer: Renderer, renderCanvas: RenderCanvas) {
        // Must trigger a re-render now or we would download a blank image
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

    private onError(err: Error) {
        this.logError(err);

        // Prevent new errors from updating if error modal already showing
        if (!this.showingError)
            this.showError(err);
    }

    private logError(err: Error) {
        console.error(err);
    }

    private showError(err: Error) {
        const errMessage =
            err instanceof AppError
                ? err.message
                : [`Unknown error.`, err.message]
        this.setState({
            error: {
                showing: true,
                message: errMessage
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
        this.renderCanvas.current?.resizeToContainer();
    }

    private beforeCameraReloads() {
        this.stopAll();
    }

    private async onCameraReloaded() {
        if (this.availableFeatures.camera)
            await this.sourceManager.resumeCurrent();
        this.startAll();
        this.renderer.forceRender();
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
                />
                <ShutterBar
                    pickImageCallback={this.handleChosenImage.bind(this)}
                    shutterCallback={this.handleShutter.bind(this)}
                />
            </>
        );
    }
}
