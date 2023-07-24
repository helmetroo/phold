import { Component } from 'preact';

interface State {
    animating: boolean
}
export default class ShutterFlash extends Component<{}, State> {
    state: State = {
        animating: false
    }

    animate() {
        this.setState({
            animating: true
        });
    }

    stopAnimating() {
        this.setState({
            animating: false
        });
    }

    render() {
        return (
            <div
                class={`${this.state.animating ? 'block animate-shutter-flash' : 'hidden'} absolute w-full h-full z-10`}
                onAnimationEnd={this.stopAnimating.bind(this)}
            />
        );
    }
}
