import { Component, createRef, ContextType } from 'preact';
import { computed, effect, signal } from '@preact/signals';

import SettingsCtx from '@/contexts/settings';

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

import isOniOS from '@/utils/is-on-ios';

export default class App extends Component {
    // Objects
    private sourceManager = new SourceManager();
    private faceWatcher = new FaceWatcher(this.onDetectFaces.bind(this));
    private renderer = new Renderer(this.onRequestResize.bind(this));

    // Refs
    private renderCanvas = createRef<RenderCanvas>();
    private shutterFlash = createRef<ShutterFlash>();

    // Signals
    private error = {
        showing: signal(false),
        message: signal<string[]>([])
    };
    private confirmingChosenPhoto = signal(false);
    private notConfirmingChosenPhoto = computed(() => !this.confirmingChosenPhoto.value);

    private availableFeatures = {
        renderer: false,
        faceWatcher: false,
        camera: false,
    };
    private orientationTypeBeforeChoosingImage: OrientationType | 'unknown' =
        'unknown';

    static contextType = SettingsCtx;
    declare context: ContextType<typeof SettingsCtx>;

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

        this.watchForOrientationTypeChange();
        this.watchForAppFocusAndBlur();
        this.watchForFoldsSettingsChanges();
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

    private watchForOrientationTypeChange() {
        effect(() => {
            const newOrientationType =
                this.context.orientationType.value;

            // Set flex direction of app ctr
            App.setFlexDirection(newOrientationType);

            // Refresh camera if active
            if (this.sourceManager.currentType === 'camera')
                this.refreshCamera();
        });
    }

    private static setFlexDirection(orientationType: OrientationType) {
        const [container] = document.getElementsByTagName('main');
        if (!container)
            return;

        container.style.flexDirection = 'column';

        if (orientationType === 'landscape-primary') {
            container.style.flexDirection = 'row';
        } else if (orientationType === 'landscape-secondary') {
            container.style.flexDirection = 'row-reverse';
        }
    }

    private watchForAppFocusAndBlur() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden)
                this.onAppBlur();
            else
                this.onAppResume();
        });
    }

    private onAppResume() {
        if (this.sourceManager.currentType !== 'camera')
            return;

        // Camera freezes (particularly in PWA version) when resuming
        // so we need to refresh the camera :(
        const oniOS = isOniOS();
        if (oniOS)
            this.refreshCamera();
        else
            this.resumeCamera();
    }

    private onAppBlur() {
        if (this.sourceManager.currentType !== 'camera')
            return;

        this.sourceManager.pauseCurrent();
        this.stopAll();
    }

    private watchForFoldsSettingsChanges() {
        const foldsSettings =
            this.context.settings.folds.all();

        effect(() => {
            // Force read the settings
            (() => foldsSettings.value)();

            // Recalculate folds if we're rendering an image
            if (this.sourceManager.currentType !== 'image')
                return;

            this.setFoldsFromFaces(this.faceWatcher.faces);
            this.renderer.forceRender();
        });
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
        const currentFoldsSettings = this.context.settings.folds;
        const newFolds = faces.map(
            face => generateFolds(face, normDivisor, currentFoldsSettings)
        );

        this.renderer.folds = newFolds;
    }

    private async handleChosenImage(chosenFile: ChosenFile) {
        const renderCanvas = this.renderCanvas.current;
        if (!renderCanvas)
            return;

        this.orientationTypeBeforeChoosingImage =
            this.context.orientationType.value;

        this.sourceManager.pauseCurrent();
        this.stopAll();

        try {
            await this.sourceManager.setAndLoadFromImage(chosenFile);
        } catch (err) {
            this.onError(err as Error);
            await this.resumeCamera();

            return;
        }

        this.syncSource();
        renderCanvas.resizeToContainer();

        const imageFaces = await this.faceWatcher.detectFaces();
        this.setFoldsFromFaces(imageFaces);
        this.renderer.forceRender();

        this.confirmingChosenPhoto.value = true;
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

    private async handleSwapCamera() {
        const renderCanvas = this.renderCanvas.current;
        if (!renderCanvas)
            return;

        this.sourceManager.pauseCurrent();
        this.stopAll();

        renderCanvas.stopWatchingResizes();

        await this.sourceManager.swapCamera();
        await this.sourceManager.resumeCurrent();

        this.startAll();

        renderCanvas.resizeToContainer();
        this.renderer.forceRender();
        renderCanvas.watchResizes();
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
        if (!this.error.showing.value)
            this.showError(err);
    }

    private logError(err: Error) {
        console.error(err);
    }

    private showError(err: Error) {
        const errMessage =
            err instanceof AppError
                ? err.messageLines
                : [`Unknown error.`, err.message]

        this.error.showing.value = true;
        this.error.message.value = errMessage;
    }

    private onRequestResize() {
        this.renderCanvas.current?.resizeToContainer();
    }

    private async resumeCamera() {
        if (this.availableFeatures.camera)
            await this.sourceManager.resumeCamera();

        this.startAll();
        this.renderer.forceRender();
    }

    private async acceptChosenPhoto() {
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

    private async rejectChosenPhoto() {
        await this.switchToCamera();
    }

    private async switchToCamera() {
        // Must refresh camera if orientation changed
        const mustRefresh = this.orientationTypeBeforeChoosingImage
            !== this.context.orientationType.value;

        if (mustRefresh)
            await this.refreshCamera();

        this.sourceManager.switchToCamera();

        // Camera already playing if refreshed
        if (!mustRefresh)
            await this.sourceManager.resumeCurrent();

        // Force render necessary either here or before we do the resize canvas to ctr
        this.startAll();
        this.renderer.forceRender();

        this.confirmingChosenPhoto.value = false;
    }

    private async refreshCamera() {
        this.stopAll();
        await this.sourceManager.loadCamera();
        await this.resumeCamera();
    }

    render() {
        return (
            <>
                <ErrorOverlay
                    visible={this.error.showing}
                    message={this.error.message}
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
                    visible={this.confirmingChosenPhoto}
                    yesCallback={this.acceptChosenPhoto.bind(this)}
                    noCallback={this.rejectChosenPhoto.bind(this)}
                />
                <ShutterBar
                    visible={this.notConfirmingChosenPhoto}
                    pickImageCallback={this.handleChosenImage.bind(this)}
                    shutterCallback={this.handleShutter.bind(this)}
                    swapCameraCallback={this.handleSwapCamera.bind(this)}
                />
            </>
        );
    }
}
