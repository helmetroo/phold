import Source from '@/types/source';
import ChosenFile from '@/types/chosen-file';

export default class ImageSource extends Source {
    private image = new Image();

    constructor(chosenFile: ChosenFile) {
        super();

        this.image.src = chosenFile.url;
    }

    async load() {
        await new Promise((resolve, reject) => {
            this.image.onload = resolve;
            this.image.onerror = reject;
        });
    }

    getRaw() {
        return this.image;
    }

    getDimensions() {
        return {
            width: this.image.width,
            height: this.image.height,
        };
    }

    destroy() {
        URL.revokeObjectURL(this.image.src);
        this.image.remove();
    }

    pause() { }
    async resume() { }
}
