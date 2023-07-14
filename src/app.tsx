import { Component, createRef } from 'preact';

import SourceManager from './source-manager';
import FaceWatcher from './face-watcher';
import type { DetectedFaces } from './face-watcher';
import generateFolds from './face-fold-generator';
import Renderer from './renderer';

import RenderCanvas from './render-canvas';
import UIBar from '@/ui/bar';
import ErrorOverlay from '@/ui/error-overlay';

export default class App extends Component {
    private sourceManager = new SourceManager();
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
        this.sourceManager.destroy();
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

    private run() {
        this.syncSource();

        this.renderer.start();
        this.faceWatcher.start();
    }

    private syncSource() {
        this.renderer.source = this.sourceManager.current;
        this.faceWatcher.source = this.sourceManager.current;
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
        this.sourceManager.freeze();
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
        this.renderCanvas.current?.resizeToContainer();
    }

    render() {
        return (
            <>
                <ErrorOverlay
                    visible={this.state.error.showing}
                    message={this.state.error.message}
                    onClose={this.hideError.bind(this)}
                />
                <RenderCanvas ref={this.renderCanvas} />
                <UIBar
                    shutterCallback={this.handleShutter.bind(this)}
                />
            </>
        );
    }
}
