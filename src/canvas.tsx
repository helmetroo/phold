import { Component, createRef } from 'preact';

export default class Canvas extends Component {
    protected ref = createRef();

    componentDidMount() {
        const canvasElem = this.ref.current as HTMLCanvasElement;
        const gl = canvasElem.getContext('webgl');
        if (!gl) {
            // TODO throw error
            console.error('No GL context!');
            return;
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    render() {
        return (
            <canvas
                ref={this.ref}
                class='w-full h-full' />
        );
    }
}
