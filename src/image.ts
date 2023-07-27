import Dimensions from '@/types/dimensions';
import Source from '@/types/source';
import ChosenFile from '@/types/chosen-file';

export default class ImageSource extends Source {
    protected hasLoaded = false;
    private image = new Image();
    private imageDimensions: Dimensions = {
        width: 0,
        height: 0
    };

    constructor(chosenFile: ChosenFile) {
        super();

        this.image.src = chosenFile.url;
    }

    async load() {
        await new Promise<void>((resolve, reject) => {
            this.image.onload = () => {
                this.hasLoaded = true;
                this.imageDimensions.width = this.image.width;
                this.imageDimensions.height = this.image.height;

                resolve();
            };

            this.image.onerror = reject;
        });
    }

    getRaw() {
        return this.image;
    }

    getDimensions() {
        return this.imageDimensions;
    }

    destroy() {
        URL.revokeObjectURL(this.image.src);
        this.image.remove();
        this.hasLoaded = false;
    }

    pause() { }
    async resume() { }
}
