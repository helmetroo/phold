import { Component } from 'preact';
import { signal } from '@preact/signals';

export default class ShutterFlash extends Component {
    private animating = signal(false);

    animate() {
        this.animating.value = true;
    }

    stopAnimating() {
        this.animating.value = false;
    }

    render() {
        return (
            <div
                class={`${this.animating.value ? 'block animate-shutter-flash' : 'hidden'} absolute w-full h-full z-10`}
                onAnimationEnd={this.stopAnimating.bind(this)}
            />
        );
    }
}
