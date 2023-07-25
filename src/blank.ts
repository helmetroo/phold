import Source from '@/types/source';
import Dimensions from '@/types/dimensions';

export default class BlankSource extends Source {
    static readonly IDENTIFIER = 'blank-image';

    protected hasLoaded = false;
    private image = new Image();
    private renderer: HTMLCanvasElement;
    private dimensions: Dimensions = {
        width: 1,
        height: 1
    };

    constructor() {
        super();

        // Prevent dupes from being created by piggybacking off an existing element
        let existingRenderer =
            document.getElementById(BlankSource.IDENTIFIER) as HTMLCanvasElement;

        if (existingRenderer) {
            this.renderer = existingRenderer;
            return;
        }

        this.renderer = document.createElement('canvas');
        this.renderer.id = BlankSource.IDENTIFIER;
        this.renderer.width = this.dimensions.width;
        this.renderer.height = this.dimensions.height;
    }

    async load() {
        if (this.hasLoaded)
            return;

        const canvasCtx = this.renderer.getContext('2d');
        if (canvasCtx) {
            canvasCtx.fillStyle = 'rgba(0,0,0,0)';
            canvasCtx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
        }

        this.image = new Image(this.dimensions.width, this.dimensions.height);
        this.image.src = this.renderer.toDataURL();

        this.hasLoaded = true;
    }

    getRaw() {
        return this.image;
    }

    getDimensions() {
        return this.dimensions;
    }

    destroy() {
        URL.revokeObjectURL(this.image.src);
        this.image.remove();
        this.renderer.remove();

        this.hasLoaded = false;
    }

    pause() { }
    async resume() { }
}
