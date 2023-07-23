import { Component, createRef } from 'preact';

import type Dimensions from '@/types/dimensions';

interface Props {
}
export default class RenderCanvas extends Component<Props> {
    private canvasRef = createRef<HTMLCanvasElement>();
    private ctrRef = createRef<HTMLElement>();

    // Canvas resizing
    private resizeObserver: ResizeObserver
        = new ResizeObserver(this.onResize.bind(this));

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

    componentDidMount() {
        this.watchResizes();
    }

    componentWillUnmount() {
        this.stopWatchingResizes();
    }

    watchResizes() {
        const canvas = this.canvasRef.current;
        if (!canvas)
            return;

        this.resizeObserver.observe(canvas, {
            box: 'content-box'
        });

        if (screen && screen.orientation) {
            screen.orientation.addEventListener(
                'change',
                this.resizeToContainer.bind(this)
            );
        } else {
            window.addEventListener(
                'orientationchange',
                this.resizeToContainer.bind(this)
            );
        }
    }

    stopWatchingResizes() {
        const canvas = this.canvasRef.current;
        if (!canvas)
            return;

        this.resizeObserver.unobserve(canvas);
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

    private onResize(_: ResizeObserverEntry[]) {
        this.resizeToContainer();
    }

    getAsImage() {
        const canvas = this.canvasRef.current;
        if (!canvas)
            return;

        // TODO toBlob may be better to use
        const img = canvas.toDataURL('image/jpeg', 1);
        return img;
    }

    render() {
        return (
            <section
                class='relative flex justify-center w-full h-[calc(100vh-3rem)] landscape:h-full landscape:justify-start landscape:items-center'
                ref={this.ctrRef}
            >
                <canvas
                    ref={this.canvasRef}
                />
            </section>
        );
    }
}
