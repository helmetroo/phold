import CloseButton from './close-button';

interface Props {
    visible: boolean,
    message: string,
    onClose: () => void,
}
export default function ErrorOverlay({ visible, message, onClose }: Props) {
    return (
        <section class={`${visible ? 'flex' : 'hidden'} z-10 bg-neutral-800 items-center justify-center w-full h-full absolute inset`}>
            <CloseButton
                classes='absolute top-8 right-8'
                callback={onClose} />
            <pre class='text-white text-lg'>{message}</pre>
        </section>
    );
}
