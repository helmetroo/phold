import { Component, createRef } from 'preact';

import Source from '@/types/source';
import CameraSource from './camera';
import BlankSource from './blank';

import Renderer from './renderer';

export default class RenderCanvas extends Component {
    private ref = createRef();

    private renderer: Renderer | null = null;
    private currentSource: Source = new BlankSource();

    async initInitialSource() {
        this.currentSource = new CameraSource();

        try {
            await this.currentSource.load();
        } catch (err) {
            // TODO call err callback so a parent component can show err
            this.currentSource.destroy();

            this.currentSource = new BlankSource();
            await this.currentSource.load();
        }
    }

    async componentDidMount() {
        await this.initInitialSource();
        this.initRenderer();
    }

    componentWillUnmount() {
        this.renderer?.stop();
        this.currentSource.destroy();
    }

    private initRenderer() {
        const canvasElem = this.ref.current as HTMLCanvasElement;
        this.renderer = new Renderer(canvasElem, this.currentSource);

        this.renderer.start();
    }

    render() {
        return (
            <canvas
                ref={this.ref}
                class='w-full h-full' />
        );
    }
}
