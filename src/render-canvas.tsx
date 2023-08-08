import { Component, createRef } from 'preact';

import AppError from '@/types/app-error';
import type Dimensions from '@/types/dimensions';

interface Props {
}
export default class RenderCanvas extends Component<Props> {
    private canvasRef = createRef<HTMLCanvasElement>();
    private ctrRef = createRef<HTMLElement>();

    private srcDimensions: Dimensions = {
        width: 1,
        height: 1,
    }

    get element() {
        return this.canvasRef.current;
    }

    syncDimensions(newSrcDimensions: Dimensions) {
        this.srcDimensions = newSrcDimensions;
    }

    resizeToContainer() {
        const canvas = this.canvasRef.current;
        const ctr = this.ctrRef.current;
        if (!canvas || !ctr) {
            return;
        }

        const ctrWidth = ctr.clientWidth;
        const ctrHeight = ctr.clientHeight;

        const {
            width: srcWidth,
            height: srcHeight
        } = this.srcDimensions;
        const widthRatio = ctrWidth / srcWidth;
        const heightRatio = ctrHeight / srcHeight;
        const smallerRatio = Math.min(widthRatio, heightRatio);

        const resizedWidth = srcWidth * smallerRatio;
        const resizedHeight = srcHeight * smallerRatio;

        canvas.style.width = `${100 * resizedWidth / ctrWidth}%`;
        canvas.width = srcWidth * smallerRatio;

        canvas.style.height = `${100 * resizedHeight / ctrHeight}%`;
        canvas.height = srcHeight * smallerRatio;
    }

    resizeToDimensions({ width, height }: Dimensions) {
        const canvas = this.canvasRef.current;
        if (!canvas)
            return;

        canvas.width = width;
        canvas.height = height;
    }

    getDataUrl() {
        const canvas = this.canvasRef.current;
        if (!canvas)
            return null;

        // TODO toBlob may be better to use
        const img = canvas.toDataURL('image/jpeg', 1);
        return img;
    }

    async getBlobUrl() {
        const canvas = this.canvasRef.current;
        if (!canvas) {
            throw new AppError(
                'ImageGenerateErr',
                'Image could not be saved because a reference to the canvas is missing.'
            );
        }

        return new Promise<string>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(
                        new AppError(
                            'ImageGenerateErr',
                            'Image could not be saved due to an unknown issue.'
                        )
                    );
                }

                const blobUrl = URL.createObjectURL(blob);
                return resolve(blobUrl);
            }, 'image/jpeg', 1);
        });
    }

    render() {
        return (
            <section
                class='relative flex justify-center w-full h-[calc(100vh-4rem)] landscape:h-full landscape:justify-start landscape:items-center'
                ref={this.ctrRef}
            >
                <canvas
                    ref={this.canvasRef}
                />
            </section>
        );
    }
}
