import Source from '@/types/source';
import Dimensions from '@/types/dimensions';
import AppError from '@/types/app-error';

export type Status =
    'inactive'
    | 'active'
    | 'errored';

export default class CameraSource extends Source {
    static readonly IDENTIFIER = 'camera-video-stream';

    protected hasLoaded = false;
    private facingMode: ConstrainDOMString = 'default';
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
        this.cameraVideo.style.width = '1px';
        this.cameraVideo.style.height = '1px';

        // Maybe should go behind render canvas?
        document.body.prepend(this.cameraVideo);
    }

    async load() {
        this.hasLoaded = false;
        await this.loadCamera(this.facingMode);
        this.hasLoaded = true;
    }

    private async loadCamera(facingMode: ConstrainDOMString) {
        if (this.isActive)
            this.removeCameraStreamAndTracks();

        try {
            const vidTrackOpts: MediaTrackConstraints = {
                width: {
                    ideal: 1920
                },

                height: {
                    ideal: 1080
                },
            };

            if (facingMode !== 'default')
                vidTrackOpts.facingMode = facingMode;

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: vidTrackOpts
                });

            this.cameraStream = stream;
            this.cameraVideo.srcObject = stream;
            await CameraSource.waitUntilLoaded(this.cameraVideo);

            // Must wait for loaded evt to fire before we can get needed metadata
            this.cameraVideoDimensions = {
                width: this.cameraVideo.videoWidth,
                height: this.cameraVideo.videoHeight,
            }

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
                    new AppError(
                        'CamInUseErr', [
                        `Camera is unavailable for use.`,
                        `It's probably being used by another app.`,
                        `To use it here, close other apps using it, then try reloading.`
                    ]);
                throw alreadyInUseErr;
            }

            const cameraRejected =
                (err.name === 'NotAllowedError');
            if (cameraRejected) {
                const rejectedErr =
                    new AppError(
                        'CamDisallowedErr', [
                        `Camera is unavailable for use.`,
                        `If you'd like to re-enable it later, you can refresh this app and allow it.`,
                        `You can also manually allow the camera for this app in your browser settings.`
                    ]);
                throw rejectedErr;
            }

            const unknownErr =
                new AppError(
                    'CamUnknownErr', [
                    `Camera is unavailable for use.`,
                    err.message
                ]);
            throw unknownErr;
        }
    }

    async swapFacingMode() {
        try {
            this.facingMode =
                CameraSource.getAlternatingFacingMode(this.facingMode);
            await this.load();
        } catch (err) {
            // Go back to original facing mode
            this.facingMode =
                CameraSource.getAlternatingFacingMode(this.facingMode);
            await this.load();

            this.throwCameraError(err);
        }
    }

    private static getAlternatingFacingMode(facingMode: ConstrainDOMString) {
        return (facingMode === 'default')
            ? 'environment'
            : 'default';
    }

    private static async waitUntilLoaded(cameraVideo: HTMLVideoElement) {
        await new Promise((resolve, _) => {
            cameraVideo.onloadedmetadata = resolve;
        });
    }

    pause() {
        this.cameraVideo.pause();
    }

    async resume() {
        await this.cameraVideo.play();
    }

    getRaw() {
        return this.cameraVideo;
    }

    getDimensions() {
        return this.cameraVideoDimensions;
    }

    private removeCameraStreamAndTracks() {
        if (!this.cameraStream)
            return;

        this.cameraVideoDimensions.width = 0;
        this.cameraVideoDimensions.height = 0;
        this.status = 'inactive';

        const cameraVideoTracks = this.cameraStream.getVideoTracks();
        for (const track of cameraVideoTracks) {
            track.stop();
            this.cameraStream.removeTrack(track);
        }
    }

    destroy() {
        this.removeCameraStreamAndTracks();
        this.cameraVideo.remove();
        this.hasLoaded = false;
    }
}
