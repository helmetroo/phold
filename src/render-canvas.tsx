import { Component, createRef } from 'preact';

export default class RenderCanvas extends Component {
    private ref = createRef<HTMLCanvasElement>();

    // Canvas resizing
    private canvasCtrSizeMap: Map<Element, number[]> = new Map();
    private resizeObserver: ResizeObserver = new ResizeObserver(this.onResize.bind(this));

    get element() {
        return this.ref.current;
    }

    componentDidMount() {
        this.watchForResizes();
    }

    componentWillUnmount() {
        this.stopWatchingForResizes();
    }

    private watchForResizes() {
        const canvas = this.ref.current;
        if (!canvas)
            return;

        // (300x150 is the default size of a new canvas)
        this.canvasCtrSizeMap.set(canvas, [300, 150]);
        this.resizeObserver.observe(canvas, {
            box: 'content-box'
        });
    }

    private stopWatchingForResizes() {
        const canvas = this.ref.current;
        if (!canvas)
            return;

        this.resizeObserver.unobserve(canvas);
    }

    private onResize(entries: ResizeObserverEntry[]) {
        for (const entry of entries) {
            let width = entry.contentRect.width;
            let height = entry.contentRect.height;
            let dpr = window.devicePixelRatio;
            if (entry.devicePixelContentBoxSize) {
                // Typically the only correct path (see https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html)
                width = entry.devicePixelContentBoxSize[0].inlineSize;
                height = entry.devicePixelContentBoxSize[0].blockSize;
                dpr = 1;
            } else if (entry.contentBoxSize) {
                if (entry.contentBoxSize[0]) {
                    width = entry.contentBoxSize[0].inlineSize;
                    height = entry.contentBoxSize[0].blockSize;
                } else {
                    const contentBoxSize =
                        ((entry.contentBoxSize as unknown) as ResizeObserverSize);
                    width = contentBoxSize.inlineSize;
                    height = contentBoxSize.blockSize;
                }
            }

            const displayWidth = Math.round(width * dpr);
            const displayHeight = Math.round(height * dpr);
            this.canvasCtrSizeMap.set(
                entry.target, [displayWidth, displayHeight]
            );
        }
    }

    resizeToContainer() {
        const canvas = this.ref.current;
        if (!canvas)
            return;

        const newDims =
            this.canvasCtrSizeMap.get(canvas);

        if (!newDims)
            return false;

        const [ctrWidth, ctrHeight] = newDims;

        const resize =
            canvas.width !== ctrWidth
            || canvas.height !== ctrHeight;

        if (resize) {
            canvas.width = ctrWidth;
            canvas.height = ctrHeight;
        }

        return resize;
    }

    render() {
        return (
            <canvas
                ref={this.ref}
                class='w-full h-[calc(100vh-8rem)]' />
        );
    }
}
