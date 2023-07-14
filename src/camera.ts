import Source from '@/types/source';
import Dimensions from '@/types/dimensions';

export type Status =
    'inactive'
    | 'active'
    | 'errored';

export type FacingMode = 'user' | 'environment';

export default class CameraSource extends Source {
    static readonly IDENTIFIER = 'camera-video-stream';

    private facingMode: FacingMode = 'user';
    private cameraStream: MediaStream | null = null;
    private cameraVideo: HTMLVideoElement;
    private cameraVideoDimensions: Dimensions = {
        width: 0,
        height: 0
    };

    private status: Status = 'inactive';
    get isActive() {
        return this.status === 'active';
    }

    constructor() {
        super();

        // Piggyback off already created element.
        let existingVideoElem =
            document.getElementById(CameraSource.IDENTIFIER) as HTMLVideoElement;

        if (existingVideoElem) {
            this.cameraVideo = existingVideoElem;
            return;
        }

        // Create element we can pipe the cam stream to
        this.cameraVideo = document.createElement('video');
        this.cameraVideo.id = CameraSource.IDENTIFIER;
        this.cameraVideo.autoplay = true;
        this.cameraVideo.muted = true;
        this.cameraVideo.playsInline = true;

        // Video element must be on page or texture will not update,
        // but we can hide it :)
        this.cameraVideo.style.position = 'absolute';
        this.cameraVideo.style.zIndex = '-1';
        this.cameraVideo.style.visibility = 'hidden';
        this.cameraVideo.style.width = '1px';
        this.cameraVideo.style.height = '1px';

        // Maybe should go behind render canvas?
        document.body.prepend(this.cameraVideo);
    }

    async load() {
        await this.loadCamera(this.facingMode);
    }

    private async loadCamera(facingMode: FacingMode) {
        if (this.isActive)
            this.destroyCameraStreamAndTracks();

        try {
            // If other webcams we want to use are connected to a laptop and we use facingMode = 'user',
            // only the laptop's embedded cam is enabled...
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        /*
                        width: {
                            ideal: 4096
                        },

                        height: {
                            ideal: 2160
                        },
                        */

                        //facingMode
                    }
                });

            this.cameraStream = stream;
            this.cameraVideo.srcObject = stream;
            await CameraSource.waitUntilLoaded(this.cameraVideo);

            // Must wait for loaded evt to fire before we can get needed metadata
            this.cameraVideoDimensions =
                CameraSource.getDimensions(this.cameraStream);

            this.status = 'active';
        } catch (err: unknown) {
            this.throwCameraError(err);
        }
    }

    private throwCameraError(err: unknown) {
        this.status = 'errored';

        if (err instanceof Error) {
            const cameraAlreadyInUse =
                (err.name === 'NotReadableError')
                || (err.name === 'TrackStartError');
            if (cameraAlreadyInUse) {
                const alreadyInUseErr =
                    new Error(`Camera is unavailable for use. It's probably being used by another app. To use it here, disable it in other apps using it and try reloading.`);
                throw alreadyInUseErr;
            }

            const cameraRejected =
                (err.name === 'NotAllowedError');
            if (cameraRejected) {
                const rejectedErr =
                    new Error(`Camera is unavailable for use. If you want to re-enable it later, you can refresh or also allow the camera for this page in your browser settings.`);
                throw rejectedErr;
            }

            const unknownErr =
                new Error(`Camera is unavailable. ${err.message}`);
            throw unknownErr;
        }
    }

    async changeFacingMode(newFacingMode: FacingMode) {
        try {
            await this.loadCamera(newFacingMode);
            this.facingMode = newFacingMode;
        } catch (err) {
            this.throwCameraError(err);
        }
    }

    private static async waitUntilLoaded(cameraVideo: HTMLVideoElement) {
        await new Promise((resolve, _) => {
            cameraVideo.onloadedmetadata = resolve;
        });
    }

    play() {
        this.cameraVideo.play();
    }

    pause() {
        this.cameraVideo.pause();
    }

    private static getDimensions(cameraStream: MediaStream) {
        const cameraVideoTrack = CameraSource.getVideoTrack(cameraStream);
        const cameraVideoTrackSettings = cameraVideoTrack.getSettings();

        const dimensions: Dimensions = {
            width: cameraVideoTrackSettings.width!,
            height: cameraVideoTrackSettings.height!
        }

        return dimensions;
    }

    private static getVideoTrack(cameraStream: MediaStream) {
        return cameraStream.getVideoTracks()[0];
    }

    getRaw() {
        return this.cameraVideo;
    }

    getDimensions() {
        return this.cameraVideoDimensions;
    }

    private destroyCameraStreamAndTracks() {
        if (!this.cameraStream)
            return;

        const cameraVideoTrack = CameraSource.getVideoTrack(this.cameraStream);
        this.cameraStream.removeTrack(cameraVideoTrack);
        cameraVideoTrack.stop();

        // react-webcam also stops the entire stream (we should too?)
        ((this.cameraStream as unknown) as MediaStreamTrack).stop();
    }

    destroy() {
        this.destroyCameraStreamAndTracks();
        this.cameraVideo.remove();
    }

    async pause() {
        this.cameraVideo.pause();
    }

    async resume() {
        await this.cameraVideo.play();
    }
}
