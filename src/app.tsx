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
import ConfirmActionBar from '@/ui/confirm-action-bar';
import ShutterFlash from '@/ui/shutter-flash';
import ErrorOverlay from '@/ui/error-overlay';

type State = {
    error: {
        showing: boolean,
        message: string[] | string
    },

    confirmingAction: boolean,
}
export default class App extends Component<{}, State> {
    private sourceManager = new SourceManager({
        beforeCameraReloads: this.beforeCameraReloads.bind(this),
        onCameraReloaded: this.onCameraReloaded.bind(this)
    });
    private faceWatcher = new FaceWatcher(this.onDetectFaces.bind(this));
    private renderer = new Renderer(this.onRequestResize.bind(this));
    private renderCanvas = createRef<RenderCanvas>();
    private shutterFlash = createRef<ShutterFlash>();

    private availableFeatures = {
        renderer: false,
        faceWatcher: false,
        camera: false,
    };

    state = {
        confirmingAction: false,
        error: {
            showing: false,
            message: [],
        },
    };

    private get showingError() {
        return this.state.error.showing;
    }

    componentDidMount() {
        this.initRenderer();

        this.initCamera().then(() => {
            this.sourceManager.resumeCurrent();
        }).finally(() => {
            // Must wait for camera to load (or not) and play
            // or else we get no image err calling texSubImage2D(...)
            this.syncSource();

            // Need to ensure container resized and render step happens (latter necessary?) on iOS
            this.renderer.start();
            this.renderCanvas.current?.resizeToContainer();
            this.renderer.forceRender();

            this.hideLoader();
        });

        this.initFaceWatcher().then(() => {
            this.faceWatcher.start();
        });
    }

    componentWillUnmount() {
        this.stopAll();
    }

    private hideLoader() {
        const loader = document.getElementById('loader');
        if (!loader)
            return;

        loader.classList.add('animate-fade-out');
        loader.onanimationend = () => {
            loader.style.display = 'none';
        }
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

        this.setState(prevState => ({
            confirmingAction: true,
            error: {
                ...prevState.error
            }
        }));
    }

    private handleShutter() {
        const renderCanvas = this.renderCanvas.current;
        if (!renderCanvas)
            return;

        this.faceWatcher.stop();
        this.sourceManager.pauseCurrent();

        renderCanvas.stopWatchingResizes();

        // Anims
        this.shutterFlash.current?.animate();

        // Temporarily resize canvas to match original image size, then download
        const srcDims = this.sourceManager.current.getDimensions();
        renderCanvas.resizeToDimensions(srcDims);
        App.downloadCanvasImage(this.renderer, renderCanvas).then(() => {
            // After resizing we have to render again or the canvas goes blank
            renderCanvas.resizeToContainer();
            this.renderer.forceRender();

            renderCanvas.watchResizes();
        });

        // Keep playing video while the canvas image download may be happening
        this.sourceManager.resumeCurrent();
        this.faceWatcher.start();
    }

    private static async downloadCanvasImage(renderer: Renderer, renderCanvas: RenderCanvas) {
        // Must trigger a re-render now or we would download a blank image
        renderer.forceRender();
        const imageUrl = await renderCanvas.getBlobUrl();
        if (!imageUrl)
            return;

        // Forcing download requires us to create a proxy anchor tag
        // and clicking it to trigger the download
        const anchorElem = document.createElement('a');
        anchorElem.setAttribute('href', imageUrl);

        const fileName = `phold-image-${new Date().getTime()}.jpg`;
        anchorElem.setAttribute('download', fileName);

        // Force download
        document.body.appendChild(anchorElem);
        anchorElem.click();
        document.body.removeChild(anchorElem);

        // Clean up
        URL.revokeObjectURL(imageUrl);
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

        this.setState(prevState => ({
            confirmingAction: prevState.confirmingAction,
            error: {
                showing: true,
                message: errMessage
            }
        }));
    }

    private hideError() {
        this.setState(prevState => ({
            confirmingAction: prevState.confirmingAction,
            error: {
                showing: false,
                message: ''
            }
        }));
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

    private async acceptUploadedPhoto() {
        const renderCanvas = this.renderCanvas.current;
        if (!renderCanvas)
            return;

        renderCanvas.stopWatchingResizes();

        // Temporarily resize canvas to match original image size, then download
        const srcDims = this.sourceManager.current.getDimensions();
        renderCanvas.resizeToDimensions(srcDims);
        await App.downloadCanvasImage(this.renderer, renderCanvas);

        // After resizing we have to render again or the canvas goes blank
        renderCanvas.resizeToContainer();
        this.renderer.forceRender();

        renderCanvas.watchResizes();

        await this.switchToCamera();
    }

    private async rejectUploadedPhoto() {
        await this.switchToCamera();
    }

    private async switchToCamera() {
        this.sourceManager.switchToCamera();
        await this.sourceManager.resumeCurrent();

        // Force render necessary either here or before we do the resize canvas to ctr
        this.startAll();
        this.renderer.forceRender();

        this.setState(prevState => ({
            confirmingAction: false,
            error: {
                ...prevState.error
            }
        }));
    }

    render() {
        return (
            <>
                <ErrorOverlay
                    visible={this.state.error.showing}
                    message={this.state.error.message}
                    onClose={this.hideError.bind(this)}
                />
                <ShutterFlash
                    ref={this.shutterFlash}
                />
                <SettingsBar
                />
                <RenderCanvas
                    ref={this.renderCanvas}
                />
                <ConfirmActionBar
                    visible={this.state.confirmingAction}
                    yesCallback={this.acceptUploadedPhoto.bind(this)}
                    noCallback={this.rejectUploadedPhoto.bind(this)}
                />
                <ShutterBar
                    pickImageCallback={this.handleChosenImage.bind(this)}
                    shutterCallback={this.handleShutter.bind(this)}
                />
            </>
        );
    }
}
